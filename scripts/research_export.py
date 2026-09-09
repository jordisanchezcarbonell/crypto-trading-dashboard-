"""Run/replay the isolated kernel and export certified per-asset comparisons.

No exchange, SQLite, operational exporter, or credentials. The dashboard is a
consumer of the research store. Run twice by default and require equal hashes.
"""
from __future__ import annotations

import argparse
from dataclasses import asdict
from datetime import UTC, datetime
import hashlib
import json
import math
from pathlib import Path
import sys

import numpy as np

STRATEGIES = {
    "ema-v1": ("EMA-v1", "Trend EMA 50/200 · baseline operacional congelado"),
    "ema-v2-risk": ("EMA-v2-risk", "EMA 50/200 · sizing por volatilidad · baseline congelado"),
    "donchian-v1": ("Donchian", "Breakout 120 barras · salida 60 barras"),
    "mean-reversion-v1": ("Mean Reversion", "Z-score 30 barras · entrada −2 · salida 0"),
    "public-average-4h-v1": ("AverageStrategy · adaptación", "Señal pública EMA 8/21 · cruces con volumen positivo"),
    "public-bband-rsi-4h-v1": ("BbandRsi · adaptación 4h", "Señal pública RSI 14 + Bollinger 20/2 · entrada <30 · salida >70"),
}


def finite(value):
    return float(value) if math.isfinite(value) else None


def chart_points(timestamps, equities, stride=24):
    values = np.asarray(equities, dtype=float)
    dd = (values / np.maximum.accumulate(values) - 1.) * 100.
    indices = {0, len(values) - 1}
    for start in range(0, len(values), stride):
        stop = min(start + stride, len(values))
        indices.update((start, stop - 1, start + int(np.argmin(dd[start:stop])),
                        start + int(np.argmax(values[start:stop]))))
    return [[str(timestamps[i]), float(values[i] / values[0] * 100.), float(dd[i])]
            for i in sorted(indices)]


def return_correlation(left_times, left, right_times, right):
    if list(left_times) != list(right_times):
        raise ValueError("correlation requires identical timestamps")
    a, b = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
    a, b = a[1:] / a[:-1] - 1., b[1:] / b[:-1] - 1.
    if len(a) < 2 or np.std(a) == 0 or np.std(b) == 0:
        return None
    return finite(np.corrcoef(a, b)[0, 1])


def build_bundle(repo: Path):
    sys.path.insert(0, str(repo / "src"))
    from crypto_trading_lab.research.dataset import DatasetManifest, DatasetResolver, LocalDatasetConfig
    from crypto_trading_lab.research.gates.run import run_all_gates
    from crypto_trading_lab.research.protocol import load_protocol, protocol_hash
    from crypto_trading_lab.research.reference import load_reference
    from crypto_trading_lab.research.runner import run_experiment
    from crypto_trading_lab.research.spec import load_spec
    from crypto_trading_lab.research.store.reader import read_execution

    gates = run_all_gates(repo)
    if not gates.passed:
        raise RuntimeError(str(gates.failures()))
    specs = repo / "src/crypto_trading_lab/research/specs"
    protocol, protocol_sha = load_protocol(specs / "protocol/protocol-v1.toml",
                                         reference=load_reference(specs / "references/run3-2026-08-22.toml"))
    manifest = DatasetManifest.load(specs / "datasets/binance-spot-4h-frozen-2026-08-19.toml")
    resolver = DatasetResolver.from_local_config(manifest, LocalDatasetConfig.load(repo / "research_data/datasets.local.toml"))
    sources = {r["strategy"]: r for r in json.loads((specs / "external/sources.json").read_text())}
    stored, strategies = {}, []
    for name, (label, description) in STRATEGIES.items():
        spec = load_spec(specs / f"baselines/{name}.toml", protocol=protocol,
                         protocol_sha256=protocol_sha, dataset_manifest=manifest, repo_root=repo)
        print(f"Running {name}: all nine assets, twice", flush=True)
        first = run_experiment(spec, resolver=resolver, repo_root=repo)
        second = run_experiment(spec, resolver=resolver, repo_root=repo)
        if first.status != "OK" or second.status != "OK" or first.result.result_hash != second.result.result_hash:
            raise RuntimeError(f"{name}: reproducibility failed")
        certified = read_execution(first.reference.experiment_id, first.reference.execution_id)
        stored[name] = certified
        asset_results = {}
        for symbol in certified.symbols:
            result, metrics = certified.results[symbol], certified.metrics[symbol]
            p = metrics.performance
            curve = result.equity_curve
            times, equities = curve["timestamp"].to_list(), curve["equity"].to_list()
            asset_results[symbol] = {
                "startAt": times[0].isoformat(), "endAt": times[-1].isoformat(),
                "bars": len(times), "missingBars": certified.integrity[symbol].missing_bar_count,
                "causalityPassed": certified.causality[symbol].passed,
                "metrics": {"returnPct": finite(p.total_return * 100), "cagrPct": finite(p.cagr * 100),
                    "maxDrawdownPct": finite(p.maximum_drawdown * 100), "sharpe": finite(p.sharpe),
                    "sortino": finite(p.sortino), "calmar": finite(p.calmar), "trades": p.number_of_trades,
                    "winRatePct": finite(p.win_rate * 100), "profitFactor": finite(p.profit_factor),
                    "turnover": finite(metrics.turnover_annualized), "exposurePct": finite(metrics.capital_exposure_pct * 100),
                    "fees": finite(p.fees), "spread": finite(p.spread), "slippage": finite(p.slippage),
                    "finalEquity": finite(result.final_equity)},
                "curve": chart_points([t.isoformat() for t in times], equities),
            }
        strategies.append({"id": name, "label": label, "description": description,
            "parameters": dict(spec.strategy.parameters), "executionPolicy": asdict(spec.strategy.execution),
            "source": sources.get(name), "experimentId": first.reference.experiment_id,
            "executionId": first.reference.execution_id, "repeatExecutionId": second.reference.execution_id,
            "resultHash": first.result.result_hash, "strategyHash": spec.strategy_code_hash,
            "sourceCommit": certified.execution.git_commit, "sourceDirty": certified.execution.git_dirty,
            "reproducible": True, "status": "RESEARCH", "assets": asset_results})
        print(f"  stored {first.reference.experiment_id}: reproducible", flush=True)

    correlations = {}
    for symbol in protocol.universe:
        matrix = []
        for left in STRATEGIES:
            row = []
            a = stored[left].results[symbol].equity_curve
            for right in STRATEGIES:
                b = stored[right].results[symbol].equity_curve
                row.append(return_correlation(a["timestamp"].to_list(), a["equity"].to_list(),
                                              b["timestamp"].to_list(), b["equity"].to_list()))
            matrix.append(row)
        correlations[symbol] = matrix
    return {"schemaVersion": 1, "generatedAt": datetime.now(UTC).isoformat(), "segment": "IN_SAMPLE",
        "protocol": {"id": protocol.version, "hash": protocol_hash(protocol), "timeframe": "4h",
            "feeRate": protocol.fee_rate, "spreadBps": protocol.spread_bps, "slippageBps": protocol.slippage_bps,
            "initialCapital": protocol.initial_cash_per_asset, "datasetId": manifest.dataset_id,
            "datasetHash": manifest.manifest_sha256, "universe": list(protocol.universe)},
        "gates": [{"name": g.name, "passed": g.passed} for g in gates.results],
        "strategies": strategies, "correlations": correlations,
        "limitations": ["Histórico IN-SAMPLE; no demuestra rentabilidad futura ni OOS.",
            "Comparación por activo: mismo periodo y capital dentro de cada activo. No es una cartera agregada.",
            "Fuentes públicas adaptadas: no reproduce las salidas ROI de Freqtrade ni sus resultados anunciados.",
            "BbandRsi cambia de 1h a 4h. Ambas adaptaciones usan stop de 10% y bloqueo hasta señal flat.",
            "Universo congelado de nueve activos; no elimina survivorship bias. BTC/ETH fueron activos de desarrollo.",
            "Gaps reportados, sin rellenar: retornos entre observaciones disponibles con anualización 4h.",
            "Curvas reducidas para visualización conservando extremos por bloque; métricas y correlaciones usan todas las observaciones.",
            "Stress, sensibilidad y walk-forward pendientes; ninguna estrategia está promovida a paper."]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--research-root", type=Path, required=True)
    args = parser.parse_args()
    bundle = build_bundle(args.research_root.resolve())
    destination = Path(__file__).resolve().parents[1] / "data/research/measured.json"
    payload = json.dumps(bundle, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    temporary = destination.with_suffix(".tmp")
    temporary.write_text(payload)
    temporary.replace(destination)
    print(f"Exported {destination} ({len(payload)} bytes), SHA256 {hashlib.sha256(payload.encode()).hexdigest()}", flush=True)


if __name__ == "__main__":
    main()
