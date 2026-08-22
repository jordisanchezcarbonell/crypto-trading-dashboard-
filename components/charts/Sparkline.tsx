import { CHART } from "./chart-theme";

/**
 * A shape-only chart, for the space beside a headline figure.
 *
 * Deliberately hand-drawn SVG rather than a fourth recharts surface: there
 * are no axes, no ticks, no tooltip and no responsive container to lay out,
 * so the whole component is a path and a fill. It stretches to its box
 * (`preserveAspectRatio="none"`), which would distort a real chart but is
 * exactly right here — the sparkline claims a trend, never a value.
 *
 * Presentational by construction: `aria-hidden`, because the number it sits
 * next to is the accessible content.
 */
export function Sparkline({
  values,
  tone = "accent",
  className,
}: {
  values: number[];
  tone?: "accent" | "positive" | "negative";
  className?: string;
}) {
  // Two points make a line; one makes nothing worth drawing.
  if (values.length < 2) return null;

  const color =
    tone === "positive" ? CHART.pos : tone === "negative" ? CHART.neg : CHART.accent;

  const W = 100;
  const H = 32;
  // Inset so a 2px stroke at the extremes is not clipped by the viewBox.
  const PAD = 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series has no range to normalise against; draw it down the middle
  // instead of dividing by zero.
  const range = max - min || 1;
  const flat = max === min;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = flat
      ? H / 2
      : H - PAD - ((v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  // Scoped to the tone so two sparklines of different colours on one page do
  // not share — and overwrite — a single gradient definition.
  const gradientId = `sparkline-${tone}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
