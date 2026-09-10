"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BASELINE_SHARPE, GATES, QUINTILES } from "@/lib/research/regime";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
} from "@/components/charts/chart-theme";

/**
 * Two claims that are visual by nature, so they are drawn rather than described.
 *
 * A note on colour, because the palette was validated rather than eyeballed:
 * this dashboard's gain/loss pair (#34d399 / #fb7185) separates by only ΔE 4.6
 * under deuteranopia, below even the 6-8 floor. Changing the whole dashboard's
 * palette for one page would be worse than the deviation, so instead colour here
 * never carries identity on its own -- the sign is given by which side of the
 * zero baseline a bar sits on, and again by the value printed on it. The chart
 * reads correctly with the colours removed entirely.
 */

const bps = (value: number) => `${value.toFixed(2).replace(".", ",")} bps`;

const LABEL_STYLE = { fill: "#7d8698", fontSize: 11 } as const;

const label = (value: unknown) =>
  value == null ? "" : Number(value).toFixed(1).replace(".", ",");

type ShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
};

/**
 * A bar rounded at the data end and square where it meets the baseline.
 *
 * Drawn rather than configured for two reasons. Recharts types a Cell radius as
 * a single number, so the corner pair cannot vary by sign; and the stacked
 * workaround it suggested emitted rects with negative `height`, which the SVG
 * spec calls an error and tells the renderer to drop. This browser tolerated
 * them, which is exactly the kind of thing that renders here and vanishes
 * elsewhere.
 */
function DivergingBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
}: ShapeProps) {
  const top = height < 0 ? y + height : y;
  const size = Math.abs(height);
  const r = Math.min(4, size, width / 2);
  const fill = value >= 0 ? CHART.pos : CHART.neg;
  const bottom = top + size;
  const path =
    value >= 0
      ? `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + width - r},${top} Q${x + width},${top} ${x + width},${top + r} L${x + width},${bottom} Z`
      : `M${x},${top} L${x},${bottom - r} Q${x},${bottom} ${x + r},${bottom} L${x + width - r},${bottom} Q${x + width},${bottom} ${x + width},${bottom - r} L${x + width},${top} Z`;
  return <path d={path} fill={fill} />;
}

/** The value, always at the free end of its own bar, never at the baseline. */
function EndLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
}: ShapeProps) {
  const top = height < 0 ? y + height : y;
  const size = Math.abs(height);
  return (
    <text
      x={x + width / 2}
      y={value >= 0 ? top - 6 : top + size + 14}
      textAnchor="middle"
      style={LABEL_STYLE}
    >
      {label(value)}
    </text>
  );
}

export function EdgePerExposureChart() {
  return (
    <ChartFrame height={230}>
      <ResponsiveContainer>
        <BarChart
          data={QUINTILES}
          margin={{ ...chartMargin, top: 20, bottom: 4 }}
        >
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            {...axisProps}
            width={54}
            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
            domain={[-60, 40]}
            // Zero is the semantic anchor of this chart, so it has to be a tick.
            // Recharts' automatic choice skipped it entirely (-35, -10, 15, 40).
            ticks={[-60, -40, -20, 0, 20, 40]}
          />
          {/* The zero line is the encoding, not decoration: it is what makes the
              sign readable without relying on the fill colour. */}
          <ReferenceLine y={0} stroke={CHART.axis} strokeWidth={1} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={
              <ChartTooltip
                valueFormatter={(value) => bps(Number(value))}
                nameFormatter={() => "Por unidad de exposición"}
              />
            }
          />
          <Bar
            dataKey="perUnit"
            maxBarSize={44}
            isAnimationActive={false}
            shape={<DivergingBar />}
          >
            <LabelList dataKey="perUnit" content={<EndLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function GateSharpeChart() {
  const gated = GATES.filter((row) => !row.baseline);
  return (
    <ChartFrame height={230}>
      <ResponsiveContainer>
        <BarChart data={gated} margin={{ ...chartMargin, top: 20, bottom: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            {...axisProps}
            width={54}
            domain={[0, 1]}
            tickFormatter={(v) => Number(v).toFixed(2).replace(".", ",")}
          />
          {/* One hue for every bar: the claim is about the shape across an
              ordered parameter, and the reference line is what separates the
              one threshold that clears from the two that do not. Colouring the
              winner differently would state the conclusion twice. */}
          <ReferenceLine
            y={BASELINE_SHARPE}
            stroke={CHART.axis}
            strokeDasharray="4 4"
            label={{
              value: `sin puerta ${BASELINE_SHARPE.toFixed(3).replace(".", ",")}`,
              position: "insideTopRight",
              fill: "#7d8698",
              fontSize: 11,
            }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={
              <ChartTooltip
                valueFormatter={(value) =>
                  Number(value).toFixed(3).replace(".", ",")
                }
                nameFormatter={() => "Sharpe"}
              />
            }
          />
          <Bar
            dataKey="sharpe"
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            fill={CHART.accent}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="sharpe"
              position="top"
              formatter={(v: unknown) => Number(v).toFixed(3).replace(".", ",")}
              style={{ fill: "#7d8698", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
