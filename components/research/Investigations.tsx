import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  FRICTION_FLOOR,
  FUNDING_NOTE,
  INVESTIGATIONS,
  ROUND_TRIP_BPS,
  VERDICT_TONE,
} from "@/lib/research/investigations";

/**
 * What was investigated and closed, and the number that closed it.
 *
 * Ordered with the friction floor first. It is the constraint that predicts
 * every result below it, so a reader who stops after the first card has still
 * understood the main finding; reading the discards in any order after that
 * costs nothing.
 */
export function Investigations() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-ink">
          Qué se investigó y por qué se descartó
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Un registro que sólo enseña lo que sobrevivió no es un registro. Aquí
          está la mitad más grande y más informativa: qué explicaciones ya se
          han pagado, con la medición que cerró cada una y el documento donde
          está el desarrollo completo.
        </p>
      </header>

      <Card>
        <CardHeader
          title="El suelo de fricción"
          subtitle={`Un viaje de ida y vuelta cuesta ${ROUND_TRIP_BPS.toString().replace(".", ",")} bps medidos en el motor con las fricciones del propio protocolo. Esto explica de una vez casi todo lo que hay debajo.`}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow text-faint">Lo que hemos medido</p>
              <ul className="mt-2 space-y-1.5">
                {FRICTION_FLOOR.measured.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 text-muted">{item.label}</span>
                    <span className="shrink-0 font-mono tabular-nums text-ink">
                      {item.value.toFixed(1).replace(".", ",")} bps
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-faint">Lo que haría falta</p>
              <ul className="mt-2 space-y-1.5">
                {FRICTION_FLOOR.required.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 text-muted">{item.label}</span>
                    <span className="shrink-0 font-mono tabular-nums text-ink">
                      {item.need.toFixed(1).replace(".", ",")} bps
                      <span className="ml-2 text-faint">
                        ({item.cost.toString().replace(".", ",")}%/año)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
            Hay un factor de 6 a 25 entre lo que encontramos y lo que se
            necesita. No fueron seis mala suertes distintas; fue la misma
            aritmética seis veces. También dice dónde puede vivir un
            superviviente: rotando poco. La fricción no se compensa con acierto,
            se compensa con paciencia.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {INVESTIGATIONS.map((investigation) => (
          <Card key={investigation.id}>
            <CardHeader title={investigation.title} />
            <CardBody className="space-y-3">
              <Badge tone={VERDICT_TONE[investigation.verdict]}>
                {investigation.verdict}
              </Badge>

              <div>
                <p className="eyebrow text-faint">La hipótesis</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {investigation.hypothesis}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-ink">
                {investigation.conclusion}
              </p>

              <ul className="space-y-2 border-t border-line pt-3">
                {investigation.evidence.map((item) => (
                  <li key={item.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-xs text-muted">
                        {item.label}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-ink">
                        {item.value}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-0.5 text-xs leading-relaxed text-faint">
                        {item.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <p className="border-t border-line pt-3 font-mono text-xs text-faint">
                {investigation.source}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Un hallazgo que no es un descarte"
          subtitle="Salió del trabajo con cortos, pero no habla de cortos: es un coste que paga el lado largo."
        />
        <CardBody className="space-y-2">
          <p className="text-sm font-medium text-ink">
            {FUNDING_NOTE.headline}
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            {FUNDING_NOTE.detail}
          </p>
          <p className="font-mono text-xs text-faint">
            {FUNDING_NOTE.observations}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
