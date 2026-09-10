import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EdgePerExposureChart, GateSharpeChart } from "./RegimeCharts";
import { GATES, QUINTILES, REGIME_FACTS, TRAPS } from "@/lib/research/regime";

/**
 * The regime study, which is not a discard and does not belong on that page.
 *
 * It is the only result here that came out partly positive, and the two halves
 * disagree: the regime is legible at the time, and gating on it is fragile.
 * Presenting either half alone would misrepresent it, so both charts sit on one
 * page with the verdict stating the split rather than resolving it.
 *
 * Every chart is accompanied by its own table. That is the accessibility floor
 * -- the numbers must be reachable without reading a picture -- and it is also
 * what lets a reader check the claim instead of trusting the shape.
 */

const signed = (value: number, digits = 2) =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits).replace(".", ",")}`;

export function RegimeAnalysis() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-ink">
          Régimen: ¿se puede saber a tiempo, o solo después?
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Tres familias distintas — EMA, momentum y roturas de máximos — dijeron
          la misma frase: ganan en los años bajistas y pierden en los alcistas.
          Esta pregunta decide qué <em>son</em>. Si el régimen solo se reconoce
          mirando atrás, lo que tenemos es un seguro y se decide con el
          estómago. Si se puede llamar a tiempo, existe una estrategia de dos
          estados que ninguna de las probadas es.
        </p>
      </header>

      <Card>
        <CardHeader
          title="La definición, que es donde está la trampa"
          subtitle="Etiquetar el régimen mirando el gráfico completo contamina todo lo que venga después."
        />
        <CardBody>
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            La etiqueta es{" "}
            <strong className="text-ink">amplitud de mercado</strong>: la
            fracción del universo que cotiza por encima de su propia media de{" "}
            {REGIME_FACTS.lookbackBars} velas, calculada en{" "}
            <code>Close[t]</code> con barras de <code>t</code> o anteriores,
            condicionando una posición ejecutada en <code>Open[t+1]</code>. Es
            información <strong className="text-ink">transversal</strong> que
            las reglas por activo nunca ven — la única razón por la que podría
            aportar algo.
          </p>
          <p className="mt-2 font-mono text-xs text-faint">
            {REGIME_FACTS.assets} activos · {REGIME_FACTS.observations}{" "}
            observaciones utilizables
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="El régimen sí es legible a tiempo"
          subtitle="Ventaja por unidad de exposición, por quintil de amplitud. Es la columna que carga el hallazgo."
        />
        <CardBody className="space-y-4">
          <EdgePerExposureChart />
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            Que la amplitud prediga <em>cuánto</em> estará dentro la estrategia
            es mecánico y no vale nada. Que la ventaja{" "}
            <strong className="text-ink">por unidad de exposición</strong> suba
            también, de −50 a +29 bps y sin saltarse un escalón, no lo es.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-line text-left text-faint">
                  <th className="py-2 font-normal">Quintil</th>
                  <th className="py-2 font-normal">Amplitud</th>
                  <th className="py-2 text-right font-normal">Exposición</th>
                  <th className="py-2 text-right font-normal">Retorno</th>
                  <th className="py-2 text-right font-normal">Por unidad</th>
                  <th className="py-2 text-right font-normal">
                    Mercado (mediana)
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums text-ink">
                {QUINTILES.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-line/50 last:border-0"
                  >
                    <td className="py-1.5">{row.label}</td>
                    <td className="py-1.5 text-muted">{row.range}</td>
                    <td className="py-1.5 text-right text-muted">
                      {row.exposure.toFixed(1).replace(".", ",")}%
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {signed(row.ret)}
                    </td>
                    <td className="py-1.5 text-right font-semibold">
                      {signed(row.perUnit)}
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {signed(row.marketMedian)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Pero explotarlo es frágil"
          subtitle="Apagar la estrategia en régimen malo, con el coste de salir y volver cobrado. Umbral causal, de ventana expansiva."
        />
        <CardBody className="space-y-4">
          <GateSharpeChart />
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            <strong className="text-ink">
              Solo uno de tres umbrales mejora.
            </strong>{" "}
            Es un pico único, no una región robusta, y ese es literalmente el
            criterio de sobreajuste fijado en el encargo original: detectar si
            existe una región robusta de parámetros o un único pico
            sobreoptimizado. Es un pico.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="border-b border-line text-left text-faint">
                  <th className="py-2 font-normal">Puerta</th>
                  <th className="py-2 text-right font-normal">CAGR</th>
                  <th className="py-2 text-right font-normal">Caída máxima</th>
                  <th className="py-2 text-right font-normal">Sharpe</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums text-ink">
                {GATES.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-line/50 last:border-0"
                  >
                    <td className="py-1.5 font-sans">
                      {row.label}
                      {row.baseline && (
                        <span className="ml-2 text-faint">referencia</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {row.cagr.toFixed(1).replace(".", ",")}%
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {row.drawdown.toFixed(1).replace(".", ",")}%
                    </td>
                    <td className="py-1.5 text-right font-semibold">
                      {row.sharpe.toFixed(3).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Lo que sí aguanta, y no es lo que buscábamos"
            subtitle="El percentil 60 cambia retorno por daño, y ese intercambio no depende de un solo umbral."
          />
          <CardBody className="space-y-2">
            <p className="text-sm leading-relaxed text-ink">
              Baja el CAGR de 29,3% a 22,0% y la caída máxima de −69,5% a
              −55,6%.
            </p>
            <p className="text-xs leading-relaxed text-muted">
              Coherente con todo lo demás del proyecto: la palanca que esta
              familia ofrece de verdad es reducir el daño, no aumentar el
              retorno. El marco de seguro se mantiene, con una precisión nueva —
              el seguro se puede dosificar, a costa de retorno.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Dos trampas que casi cuelan"
            subtitle="Ambas parecían resultados. Se quedan escritas porque las dos estuvieron a punto de funcionar."
          />
          <CardBody className="space-y-3">
            {TRAPS.map((trap) => (
              <div key={trap.title}>
                <p className="text-xs font-medium text-ink">{trap.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {trap.body}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Respuesta" />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">LEGIBLE A TIEMPO</Badge>
            <Badge tone="warning">EXPLOTARLO ES FRÁGIL</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-ink">
            El régimen <strong>es</strong> legible a tiempo. La amplitud de
            mercado, calculada de forma estrictamente causal, separa periodos en
            los que estar dentro paga de periodos en los que no, y lo hace de
            forma monótona. Convertirlo en una puerta rentable es otra cosa: la
            mejora existe pero descansa en un solo umbral y sus vecinos no la
            acompañan.
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            Salvedad dicha entera: esto está medido sobre el periodo completo,
            que incluye el lado de reserva. Para esta línea de trabajo la
            reserva ya estaba quemada y esta ronda no la desquema —{" "}
            <strong className="text-ink">
              nada de lo anterior es fuera de muestra
            </strong>
            . El recuento acumulado de ensayos sube a {REGIME_FACTS.trials}.
          </p>
          <p className="font-mono text-xs text-faint">{REGIME_FACTS.source}</p>
        </CardBody>
      </Card>
    </div>
  );
}
