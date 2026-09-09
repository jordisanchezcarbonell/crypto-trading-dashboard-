"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { axisProps, gridProps, ChartTooltip } from "@/components/charts/chart-theme";
import type { MeasuredComparison, MeasuredStrategy } from "@/lib/research/measured";

const COLORS = ["#22d3ee", "#a78bfa", "#fbbf24", "#fb7185", "#60a5fa", "#4ade80"];
const number = (v: number | null, digits = 2) => v === null ? "—" : new Intl.NumberFormat("es-ES", {maximumFractionDigits: digits, minimumFractionDigits: digits}).format(v);
const METRICS: [keyof MeasuredStrategy["result"]["metrics"], string, string][] = [
  ["returnPct", "Retorno neto", "%"], ["cagrPct", "CAGR", "%"], ["maxDrawdownPct", "Caída máxima", "%"],
  ["sharpe", "Sharpe", ""], ["sortino", "Sortino", ""], ["calmar", "Calmar", ""],
  ["trades", "Operaciones cerradas", ""], ["winRatePct", "Aciertos", "%"], ["profitFactor", "Profit factor", ""],
  ["turnover", "Turnover anual", "×"], ["exposurePct", "Capital expuesto medio", "%"],
  ["fees", "Fees pagadas", " USDT"], ["spread", "Coste de spread", " USDT"], ["slippage", "Slippage pagado", " USDT"],
  ["finalEquity", "Capital final", " USDT"],
];

export function MeasuredCompare({data}: {data: MeasuredComparison}) {
  const [enabled, setEnabled] = useState<string[]>(data.strategies.map(s => s.id));
  const [view, setView] = useState<"equity" | "drawdown">("equity");
  const visible = data.strategies.filter(s => enabled.includes(s.id));
  const first = data.strategies[0].result;
  const chart = useMemo(() => {
    const rows = new Map<number, Record<string, number>>();
    for (const s of data.strategies) for (const [timestamp, equity, dd] of s.result.curve) {
      const ts = Date.parse(timestamp), row = rows.get(ts) ?? {ts};
      row[s.id] = view === "equity" ? equity : dd;
      rows.set(ts, row);
    }
    return [...rows.values()].sort((a, b) => a.ts - b.ts);
  }, [data.strategies, view]);
  return <div className="animate-rise space-y-6">
    <header className="rounded-2xl border border-line bg-linear-to-br from-surface via-surface to-accent/5 p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-accent">BACKTEST · IN-SAMPLE</span><span className="text-xs text-muted">6 estrategias · 9 activos · resultados reproducidos</span></div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Estrategias, frente a los datos.</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Compara las EMA con Donchian, reversión a la media y dos señales públicas. Retornos netos de costes, pérdidas incluidas. Ninguna está aprobada para operar con dinero real.</p>
      <nav aria-label="Activo de investigación" className="mt-6 flex flex-wrap gap-2">{data.protocol.universe.map(asset => <Link key={asset} href={`/research/compare?asset=${encodeURIComponent(asset)}`} aria-current={asset === data.asset ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm transition-colors ${asset === data.asset ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:bg-raised"}`}>{asset.split("/")[0]}</Link>)}</nav>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 lg:grid-cols-4">{[["ACTIVO", data.asset], ["PERIODO UTC", `${first.startAt.slice(0,10)} → ${first.endAt.slice(0,10)}`], ["CAPITAL INICIAL", `${number(data.protocol.initialCapital, 0)} USDT`], ["EJECUCIÓN", "Cierre t → apertura t+1 · 4h"]].map(([label, value]) => <div key={label}><div className="eyebrow text-faint">{label}</div><div className="mt-1 text-sm text-ink">{value}</div></div>)}</div>
    </header>
    <div className="grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">{data.strategies.map((s, i) => <label key={s.id} className={`cursor-pointer rounded-xl border p-4 transition-colors ${enabled.includes(s.id) ? "border-edge bg-surface" : "border-line bg-surface/30 opacity-60"}`}>
      <div className="flex items-center gap-2"><input type="checkbox" aria-label={s.label} className="accent-cyan-400" checked={enabled.includes(s.id)} onChange={() => setEnabled(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}/><span className="h-2 w-2 rounded-full" style={{background: COLORS[i]}}/><span className="text-sm font-medium text-ink">{s.label}</span></div>
      <p className="mt-2 min-h-8 text-xs text-muted">{s.description}</p><div className="mt-3 flex gap-6"><div><div className="eyebrow text-faint">CAGR</div><div className={`num text-lg ${(s.result.metrics.cagrPct ?? 0) < 0 ? "text-neg" : "text-ink"}`}>{number(s.result.metrics.cagrPct)}%</div></div><div><div className="eyebrow text-faint">MAX DD</div><div className="num text-lg text-neg">{number(s.result.metrics.maxDrawdownPct)}%</div></div></div>
    </label>)}</div>
    <Card><CardHeader title={view === "equity" ? "Crecimiento de 100 · neto de costes" : "Caídas desde máximos"} subtitle="Selecciona las estrategias que quieres superponer. Escala lineal; no es una previsión." right={<div className="flex gap-1 rounded-lg bg-base p-1">{(["equity", "drawdown"] as const).map(v => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-md px-3 py-1 text-xs ${view === v ? "bg-raised text-ink" : "text-muted"}`}>{v === "equity" ? "Equity" : "Drawdown"}</button>)}</div>}/><CardBody>
      {visible.length === 0 ? <div className="flex h-96 items-center justify-center text-muted">Selecciona al menos una estrategia.</div> : <div className="h-96 w-full" role="img" aria-label={`Curvas de ${view} para ${data.asset}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{top: 15, right: 15, bottom: 10, left: 5}}>
        <CartesianGrid {...gridProps}/><XAxis {...axisProps} dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={v => new Date(v).getUTCFullYear().toString()} minTickGap={60}/><YAxis {...axisProps} width={70} tickFormatter={v => view === "drawdown" ? `${v}%` : number(v, 0)}/><ReferenceLine y={view === "equity" ? 100 : 0} stroke="#64748b" strokeDasharray="4 4"/>
        <Tooltip content={<ChartTooltip labelFormatter={v => new Date(Number(v)).toISOString().slice(0,10)} valueFormatter={v => `${number(v)}${view === "drawdown" ? "%" : ""}`}/>}/>
        {visible.map(s => <Line key={s.id} dataKey={s.id} name={s.label} stroke={COLORS[data.strategies.findIndex(item => item.id === s.id)]} strokeWidth={1.8} dot={false} connectNulls isAnimationActive={false} type="linear"/>)}</LineChart></ResponsiveContainer></div>}
      <p className="mt-3 text-xs text-faint">Métricas sobre {number(first.bars, 0)} observaciones. Curvas simplificadas conservando extremos; huecos sin rellenar: {first.missingBars} barras.</p>
    </CardBody></Card>
    <Card><CardHeader title="Comparación de resultados" subtitle="Mismo activo, periodo, capital y fricciones. Las políticas de sizing y salida pertenecen a cada estrategia."/><CardBody><div className="overflow-x-auto"><table aria-label="Métricas comparativas" className="w-full text-sm"><thead><tr className="border-b border-line"><th className="py-3 text-left text-muted">Métrica</th>{visible.map(s => <th key={s.id} className="min-w-36 px-3 py-3 text-right font-medium text-ink">{s.label}</th>)}</tr></thead><tbody>{METRICS.map(([key, label, suffix]) => <tr key={key} className="border-b border-line/50 last:border-0"><th className="whitespace-nowrap py-2.5 text-left font-normal text-muted">{label}</th>{visible.map(s => <td key={s.id} className={`num whitespace-nowrap px-3 py-2.5 text-right ${key === "maxDrawdownPct" || (key === "returnPct" && (s.result.metrics[key] ?? 0) < 0) ? "text-neg" : "text-ink"}`}>{number(s.result.metrics[key], key === "trades" ? 0 : 2)}{s.result.metrics[key] !== null ? suffix : ""}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-xs text-faint">Fees {data.protocol.feeRate * 100}% por ejecución · spread {data.protocol.spreadBps} bps · slippage {data.protocol.slippageBps} bps. Valores indefinidos: —.</p></CardBody></Card>
    <Card><CardHeader title="Correlación de retornos" subtitle="Pearson sobre retornos entre observaciones coincidentes. Una correlación baja no compensa una estrategia que pierde dinero."/><CardBody><div className="overflow-x-auto"><table aria-label="Matriz de correlación" className="w-full text-xs"><thead><tr><th/>{visible.map(s => <th key={s.id} className="min-w-28 p-2 font-normal text-muted">{s.label}</th>)}</tr></thead><tbody>{visible.map(a => <tr key={a.id}><th className="whitespace-nowrap p-2 text-left font-normal text-muted">{a.label}</th>{visible.map(b => {
      const v = data.correlations[data.strategies.findIndex(s => s.id === a.id)][data.strategies.findIndex(s => s.id === b.id)];
      return <td key={b.id} className="num border-4 border-surface p-3 text-center text-ink" style={{background: v === null ? "transparent" : `rgba(34,211,238,${0.04 + Math.abs(v) * 0.28})`}}>{number(v)}</td>;
    })}</tr>)}</tbody></table></div></CardBody></Card>
    <Card><CardHeader title="Qué hemos verificado · qué falta" subtitle={`Exportado ${data.generatedAt.slice(0,19).replace("T", " ")} UTC`}/><CardBody><div className="mb-4 flex flex-wrap gap-2">{["Dataset con hash", "Causalidad comprobada", "Dos ejecuciones idénticas", "Sin cambios en RUN-3"].map(label => <span key={label} className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent">{label}</span>)}</div>
      <ul className="space-y-2 text-xs leading-relaxed text-muted">{data.limitations.map(note => <li key={note}>• {note}</li>)}</ul><div className="mt-5 space-y-3">{data.strategies.map(s => <details key={s.id} className="rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm text-ink">{s.label} — fuente y trazabilidad</summary><div className="mt-3 space-y-2 break-all text-xs text-muted">
        {s.source ? <><p><a className="text-accent underline" href={`${s.source.sourceRepository}/blob/${s.source.sourceCommit}/${s.source.sourcePath}`} target="_blank" rel="noreferrer">Código original · {s.source.author}</a> · {s.source.license}</p><p>Timeframe original: {s.source.originalTimeframe}. Adaptación: {s.source.adaptedTimeframe}. Rentabilidad original no reproducida.</p>{s.source.changes.map(change => <p key={change}>{change}</p>)}</> : <p>Estrategia del repositorio research local.</p>}
        <p>Parámetros: {JSON.stringify(s.parameters)}</p><p>Experimento: {s.experimentId}</p><p>Ejecución: {s.executionId}</p><p>Repetición: {s.repeatExecutionId}</p><p>Resultado SHA-256: {s.resultHash}</p><p>Estrategia SHA-256: {s.strategyHash}</p><p>Commit base: {s.sourceCommit} · cambios locales: {s.sourceDirty ? "sí; código identificado por hash" : "no"}</p>
      </div></details>)}</div></CardBody></Card>
  </div>;
}
