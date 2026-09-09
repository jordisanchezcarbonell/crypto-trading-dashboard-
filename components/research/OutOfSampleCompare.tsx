"use client";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { axisProps, gridProps, ChartTooltip } from "@/components/charts/chart-theme";
import type { OutOfSampleView, StrategyView, Verdict } from "@/lib/research/oos";

const COLORS = ["#22d3ee", "#a78bfa", "#fbbf24", "#fb7185", "#60a5fa", "#4ade80", "#f472b6"];
const number = (v: number | null, digits = 2) =>
  v === null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);

const VERDICT: Record<Verdict, { text: string; className: string }> = {
  SURVIVES: { text: "SUPERA", className: "border-pos/40 bg-pos/10 text-pos" },
  MARGINAL: { text: "MARGINAL", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  REJECTED: { text: "DESCARTADA", className: "border-neg/40 bg-neg/10 text-neg" },
};

const METRICS: [keyof StrategyView, string, string, number][] = [
  ["returnPct", "Retorno neto", "%", 1],
  ["cagrPct", "CAGR", "%", 1],
  ["maxDrawdownPct", "Caída máxima", "%", 1],
  ["sharpe", "Sharpe", "", 3],
  ["trades", "Operaciones cerradas", "", 0],
  ["assetsPositive", "Activos en positivo", "", 0],
];

export function OutOfSampleCompare({ data }: { data: OutOfSampleView }) {
  const survivors = data.strategies.filter((s) => s.verdict !== "REJECTED");
  const [enabled, setEnabled] = useState<string[]>(survivors.map((s) => s.strategy));
  const [view, setView] = useState<"equity" | "drawdown">("equity");
  const visible = data.strategies.filter((s) => enabled.includes(s.strategy));

  const chart = useMemo(() => {
    const rows = new Map<number, Record<string, number>>();
    for (const s of data.strategies) {
      for (const point of s.curve) {
        const row = rows.get(point.ts) ?? { ts: point.ts };
        row[s.strategy] = view === "equity" ? point.equity : point.drawdown;
        rows.set(point.ts, row);
      }
    }
    return [...rows.values()].sort((a, b) => a.ts - b.ts);
  }, [data.strategies, view]);

  const toggle = (id: string) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return (
    <div className="animate-rise space-y-6">
      <header className="rounded-2xl border border-line bg-linear-to-br from-surface via-surface to-accent/5 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-accent">
            FUERA DE MUESTRA · COSTES DUPLICADOS
          </span>
          <span className="text-xs text-muted">
            {data.strategies.length} estrategias · {data.universe.length} activos · corte pre-registrado
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Qué sobrevive a la condición más dura.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Solo datos posteriores al corte, con comisión, spread y slippage duplicados a la vez. Estas cifras
          no comparten página con resultados dentro de muestra a propósito: son preguntas distintas y mezclarlas
          las haría ilegibles. Nada de esto está aprobado para operar con dinero real.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 lg:grid-cols-4">
          {[
            ["PERIODO UTC", `${data.startAt.slice(0, 10)} → ${data.endAt.slice(0, 10)}`],
            ["CAPITAL INICIAL", `${number(data.initialCapital, 0)} USDT`],
            ["EJECUCIÓN", `Cierre t → apertura t+1 · ${data.timeframe}`],
            ["FRICCIONES", "Comisión, spread y slippage ×2"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="eyebrow text-faint">{label}</div>
              <div className="mt-1 text-sm text-ink">{value}</div>
            </div>
          ))}
        </div>
      </header>

      <Card>
        <CardHeader
          title="Veredicto"
          subtitle="La regla se aplica a los datos; no es una opinión editorial. Puedes discrepar de ella sin tener que confiar en el resultado."
        />
        <CardBody>
          <p className="mb-4 rounded-lg border border-line bg-base/60 px-4 py-3 text-xs leading-relaxed text-muted">{data.rule}</p>
          <div className="grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">
            {data.strategies.map((s, index) => (
              <label
                key={s.strategy}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  enabled.includes(s.strategy) ? "border-edge bg-surface" : "border-line bg-surface/30 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={s.strategy}
                    className="accent-cyan-400"
                    checked={enabled.includes(s.strategy)}
                    onChange={() => toggle(s.strategy)}
                  />
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium text-ink">{s.strategy}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${VERDICT[s.verdict].className}`}>
                    {VERDICT[s.verdict].text}
                  </span>
                  <span className="text-xs text-muted">{s.assetsPositive}/{s.assetsTotal} activos</span>
                </div>
                <p className="mt-2 min-h-8 text-xs text-muted">{s.reason}</p>
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={view === "equity" ? "Crecimiento de 100 · neto de costes duplicados" : "Caídas desde máximos"}
          subtitle="Cartera equiponderada sobre los nueve activos. Es una construcción para poder comparar, no una cuenta real: cada activo opera con capital independiente y sin transferencias."
          right={
            <div className="flex gap-1 rounded-lg bg-base p-1">
              {(["equity", "drawdown"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setView(option)}
                  aria-pressed={view === option}
                  className={`rounded-md px-3 py-1 text-xs ${view === option ? "bg-raised text-ink" : "text-muted"}`}
                >
                  {option === "equity" ? "Equity" : "Drawdown"}
                </button>
              ))}
            </div>
          }
        />
        <CardBody>
          {visible.length === 0 ? (
            <div className="flex h-96 items-center justify-center text-muted">Selecciona al menos una estrategia.</div>
          ) : (
            <div className="h-96 w-full" role="img" aria-label={`Curvas de ${view} fuera de muestra`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 15, right: 15, bottom: 10, left: 5 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    {...axisProps}
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) => new Date(v).toISOString().slice(0, 7)}
                    minTickGap={60}
                  />
                  <YAxis {...axisProps} width={70} tickFormatter={(v) => (view === "drawdown" ? `${v}%` : number(v, 0))} />
                  <ReferenceLine y={view === "equity" ? 100 : 0} stroke="#64748b" strokeDasharray="4 4" />
                  <Tooltip
                    content={
                      <ChartTooltip
                        labelFormatter={(v) => new Date(Number(v)).toISOString().slice(0, 10)}
                        valueFormatter={(v) => `${number(v)}${view === "drawdown" ? "%" : ""}`}
                      />
                    }
                  />
                  {visible.map((s) => (
                    <Line
                      key={s.strategy}
                      dataKey={s.strategy}
                      name={s.strategy}
                      stroke={COLORS[data.strategies.findIndex((item) => item.strategy === s.strategy) % COLORS.length]}
                      strokeWidth={1.8}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                      type="linear"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-3 text-xs text-faint">
            Curvas simplificadas conservando los extremos de cada bloque, para que las caídas no se pierdan en el
            trazado. Las métricas usan todas las observaciones.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Comparación"
          subtitle="Mismo periodo, mismo universo, mismo capital y las mismas fricciones duplicadas para todas."
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table aria-label="Métricas fuera de muestra" className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-3 text-left text-muted">Métrica</th>
                  {visible.map((s) => (
                    <th key={s.strategy} className="min-w-36 px-3 py-3 text-right font-medium text-ink">
                      {s.strategy}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(([key, label, suffix, digits]) => (
                  <tr key={key} className="border-b border-line/50 last:border-0">
                    <th className="whitespace-nowrap py-2.5 text-left font-normal text-muted">{label}</th>
                    {visible.map((s) => {
                      const value = s[key] as number;
                      return (
                        <td
                          key={s.strategy}
                          className={`num whitespace-nowrap px-3 py-2.5 text-right ${
                            key === "maxDrawdownPct" || value < 0 ? "text-neg" : "text-ink"
                          }`}
                        >
                          {number(value, digits)}
                          {suffix}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Trazabilidad" subtitle="Cada fila se puede reproducir desde su identidad." />
        <CardBody>
          <div className="space-y-2">
            {data.strategies.map((s) => (
              <details key={s.strategy} className="rounded-lg border border-line p-3">
                <summary className="cursor-pointer text-sm text-ink">
                  {s.strategy} — {VERDICT[s.verdict].text}
                </summary>
                <div className="mt-3 space-y-1 break-all text-xs text-muted">
                  <p>Etiqueta del resultado: {s.label}</p>
                  <p>Experimento: {s.experimentId}</p>
                  <p>Resultado SHA-256: {s.resultHash}</p>
                  <p>
                    Ventana: {s.startAt.slice(0, 10)} → {s.endAt.slice(0, 10)}
                  </p>
                </div>
              </details>
            ))}
          </div>
          <ul className="mt-5 space-y-2 text-xs leading-relaxed text-muted">
            <li>• Histórico sobre datos congelados. No demuestra rentabilidad futura.</li>
            <li>• El corte fuera de muestra se fijó antes de ejecutar nada sobre este lado.</li>
            <li>
              • <strong className="text-ink">Estos nueve activos se eligieron a mano, y eso infla
              los retornos.</strong> Medido después sobre 104 activos seleccionados por regla,
              comprar y mantener rinde un CAGR mediano del −11,1% frente al +65,9% de estos
              nueve. La ventaja relativa frente a mantener sí se sostiene fuera de ellos —confirmada
              después sobre 102 activos nunca vistos, donde gana en el 87%—; la magnitud
              absoluta de esta página, no.
            </li>
            <li>• El sesgo de supervivencia no lo elimina el framework: son los pares listados hoy.</li>
            <li>• Ninguna estrategia está aprobada para operar con dinero real.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
