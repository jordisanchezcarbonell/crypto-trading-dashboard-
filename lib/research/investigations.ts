import type { BadgeTone } from "@/components/ui/Badge";

/**
 * The channels this project investigated and closed, with the number that
 * closed each one.
 *
 * This page exists because a research record that only lists what survived is
 * not a record, it is a highlight reel. The discarded work is the larger and
 * more informative half: it says which explanations have already been paid for,
 * so nobody spends the budget twice.
 *
 * Every entry carries the measurement that decided it and the document holding
 * the full working. Nothing here is a summary of a feeling about a strategy --
 * if a row cannot name a number, it does not belong on this page.
 */

export type Verdict = "DESCARTADO" | "REDESCUBIERTO" | "SIN DATO" | "ACTIVO";

export const VERDICT_TONE: Record<Verdict, BadgeTone> = {
  // No verdict is green. Discarding well is a good outcome, but this palette
  // reads green as gain, and a green pill here would suggest a win that the
  // evidence explicitly denies.
  DESCARTADO: "danger",
  REDESCUBIERTO: "warning",
  "SIN DATO": "muted",
  ACTIVO: "info",
};

export type Evidence = {
  /** What was measured. */
  label: string;
  /** The measured value, already formatted -- no arithmetic in the view. */
  value: string;
  /** Why that value settles the question. Optional; omit when self-evident. */
  note?: string;
};

export type Investigation = {
  id: string;
  title: string;
  /** The idea in one sentence, stated fairly enough to be worth testing. */
  hypothesis: string;
  verdict: Verdict;
  /** One line a reader can carry away without reading the evidence. */
  conclusion: string;
  evidence: Evidence[];
  /** Repository path of the document with the full working. */
  source: string;
};

/** The friction every effect size on this page is measured against. */
export const ROUND_TRIP_BPS = 23;

export const INVESTIGATIONS: Investigation[] = [
  {
    id: "order-flow",
    title: "Order flow (volumen taker)",
    hypothesis:
      "Saber qué lado cruzó el spread es información nueva, no derivada del precio, y debería anticipar el movimiento siguiente.",
    verdict: "DESCARTADO",
    conclusion:
      "Explica muy bien la vela que ya ha pasado y casi nada de la siguiente. El número que impresiona es el inoperable.",
    evidence: [
      {
        label: "Correlación con la vela coincidente",
        value: "0,30 – 0,48",
        note: "Fuerte, real y no operable: describe el pasado.",
      },
      {
        label: "Correlación con el retorno futuro",
        value: "0,0060",
        note: "Explica el 0,0036% de la varianza. t = 2,12 sólo porque n = 126.847.",
      },
      {
        label: "Diferencial entre deciles extremos",
        value: "4,2 bps",
        note: "Y sin monotonía: el decil 8 es el mejor y el 9 casi el peor.",
      },
    ],
    source: "docs/research_order_flow_and_volume.md",
  },
  {
    id: "market-profile",
    title: "Market profile (POC y área de valor)",
    hypothesis:
      "El precio revierte hacia el punto de control de la sesión anterior, y el área de valor actúa como soporte y resistencia.",
    verdict: "DESCARTADO",
    conclusion:
      "Sale al revés de su propia tesis: por encima del área de valor el precio continúa en vez de revertir.",
    evidence: [
      {
        label: "Correlación distancia al POC / retorno futuro",
        value: "−0,0075",
        note: "t = −1,55. La reversión exigiría un valor negativo y significativo.",
      },
      {
        label: "Retorno tras cerrar debajo del área",
        value: "+1,42 bps",
        note: "La tesis predice rebote al alza; es el caso más flojo.",
      },
      {
        label: "Retorno tras cerrar encima del área",
        value: "+6,21 bps",
        note: "La tesis predice caída; es el caso más fuerte.",
      },
    ],
    source: "docs/research_order_flow_and_volume.md",
  },
  {
    id: "order-book",
    title: "Libro de órdenes (profundidad, desequilibrio)",
    hypothesis:
      "La forma del libro anticipa la presión de compra y venta antes de que llegue al precio.",
    verdict: "SIN DATO",
    conclusion:
      "Binance sirve el estado actual pero no la serie histórica. Sin historia no hay backtest, y sin backtest no hay evidencia.",
    evidence: [
      { label: "Historia disponible", value: "ninguna" },
      {
        label: "Snapshot en vivo",
        value: "disponible",
        note: "Serviría para operar, no para validar.",
      },
    ],
    source: "docs/research_order_flow_and_volume.md",
  },
  {
    id: "open-interest",
    title: "Open interest",
    hypothesis:
      "El interés abierto mide posicionamiento, y los extremos de posicionamiento preceden a las vueltas.",
    verdict: "ACTIVO",
    conclusion:
      "No se puede validar hacia atrás: la API sólo devuelve 30 días. La captura del VPS construye la serie que hoy no existe.",
    evidence: [
      {
        label: "Historia que sirve la API",
        value: "30 días",
        note: "Insuficiente para cualquier contraste con sentido.",
      },
      {
        label: "Captura propia en marcha",
        value: "9 activos, cada 5 min",
        note: "Es la única pieza cuyo valor crece sólo con esperar.",
      },
    ],
    source: "docs/research_open_interest_capture.md",
  },
  {
    id: "pattern-sweep",
    title: "Barrido sistemático de patrones",
    hypothesis:
      "Con suficientes características y horizontes, alguna combinación tiene que superar a los baselines.",
    verdict: "REDESCUBIERTO",
    conclusion:
      "El ganador es el cruce de EMA con otro nombre. El barrido no encontró nada nuevo; validó lo que ya teníamos sobre 95 activos que nadie escogió.",
    evidence: [
      {
        label: "Candidatos declarados antes de mirar",
        value: "104",
        note: "Más 95 pruebas ya gastadas: 199 en total para la corrección.",
      },
      {
        label: "Confianza deflactada del mejor",
        value: "0,000",
        note: "Hace falta > 0,95. Con 199 pruebas, el azar da un Sharpe mayor.",
      },
      {
        label: "Correlación del ganador con comprar y mantener",
        value: "0,80",
      },
      {
        label: "Ventaja en 2023, único año alcista limpio",
        value: "−10,2%",
        note: "Gana sólo en el 36% de los activos. Es defensa, no ventaja.",
      },
    ],
    source: "docs/research_pattern_sweep.md",
  },
  {
    id: "short-selling",
    title: "Ponerse corto",
    hypothesis:
      "En la reserva ancha comprar y mantener hizo −72%. Un universo solo-largo prohíbe por construcción la operación que ese periodo ofrecía.",
    verdict: "DESCARTADO",
    conclusion:
      "Es una apuesta de régimen, no una ventaja: ayuda mucho en los años bajistas y hace más daño en el alcista. Nada aquí predice el régimen.",
    evidence: [
      {
        label: "Mediana solo largo vs largo/corto",
        value: "−8,7% vs −14,1%",
        note: "Sobre 86 activos con perpetuo. Mejora en sólo el 37%.",
      },
      {
        label: "Ventaja en años bajistas (2025, 2026)",
        value: "+21,0% / +21,4%",
      },
      {
        label: "Daño en el año alcista (2021)",
        value: "−19,0%",
        note: "Los retornos componen, y ese año se lleva por delante a los demás.",
      },
      {
        label: "Carry real de un corto sistemático",
        value: "+1,0% anual",
        note: "No el +6,4% que sugiere la media sin condicionar.",
      },
    ],
    source: "docs/research_short_selling.md",
  },
];

/**
 * The measurement that explains the others.
 *
 * Kept apart from the list because it is not another discarded channel: it is
 * the constraint that predicts the outcome of all of them, and it was computed
 * late. Had it been computed first, several of the investigations above would
 * have been framed differently or skipped.
 */
export const FRICTION_FLOOR = {
  measured: [
    { label: "Order flow, mejor decil", value: 4.2 },
    { label: "Market profile, dentro vs fuera", value: 4.8 },
    { label: "Funding pressure, diferencial", value: 6.0 },
  ],
  required: [
    { label: "Rotando cada vela (4h)", trips: 2190, need: 23.5, cost: 504 },
    { label: "Rotando cada día", trips: 365, need: 25.7, cost: 84 },
    { label: "Rotando cada 3 días", trips: 122, need: 31.2, cost: 28 },
    { label: "Rotando cada semana", trips: 52, need: 42.2, cost: 12 },
    { label: "Rotando cada mes", trips: 12, need: 105.2, cost: 2.8 },
  ],
};

/**
 * A finding that is not a discard, and does not fit anywhere else yet.
 *
 * It came out of the short-selling work but says nothing about shorts: it is a
 * cost the long side pays, and it only appears if those rules are run on
 * perpetuals rather than spot.
 */
export const FUNDING_NOTE = {
  headline: "Un largo en perpetuo paga 14,1% anual de funding",
  detail:
    "Condicionado a momentum positivo — justo cuando una regla tendencial está dentro — la tasa media es 1,28 bps por liquidación. Nuestras EMA están medidas sobre spot, donde el funding no existe, así que sus números son correctos tal cual. Pero llevar esas mismas reglas a perpetuos costaría 14 puntos anuales que ningún backtest de este proyecto ha cobrado nunca.",
  observations: "939.548 observaciones sobre 86 activos",
};
