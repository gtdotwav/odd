"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import type { PricePoint } from "@/types/market";

interface ChartPoint {
  value: number;
  label: string;
  date: string;
}

const PERIODS = ["1h", "6h", "24h", "7d", "30d", "Tudo"] as const;

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatChartDate(dateStr: string): { label: string; date: string } {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTHS_PT[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return {
    label: `${day} ${month}`,
    date: `${day} ${month}, ${hours}:${minutes}`,
  };
}

function filterByPeriod(history: PricePoint[], period: string): ChartPoint[] {
  if (!history.length) return [];

  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case "1h": cutoff = new Date(now.getTime() - 60 * 60 * 1000); break;
    case "6h": cutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
    case "24h": cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case "7d": cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case "30d": cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    default: cutoff = new Date(0); break; // "Tudo"
  }

  const filtered = history.filter((p) => new Date(p.recordedAt) >= cutoff);
  const points = filtered.length > 0 ? filtered : history;

  return points.map((p) => {
    const { label, date } = formatChartDate(p.recordedAt);
    return { value: p.priceYes * 100, label, date };
  });
}

// Fallback: generate deterministic data when no real data available
function generateData(period: string): ChartPoint[] {
  const count = 60;
  const seed = period.charCodeAt(0) * 7 + period.length * 13;

  const labels: Record<string, (i: number) => { label: string; date: string }> = {
    "1h": (i) => {
      const m = Math.round((i / (count - 1)) * 60);
      return { label: `${m}min`, date: `28 mar, ${10 + Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}` };
    },
    "6h": (i) => {
      const m = Math.round((i / (count - 1)) * 360);
      const h = Math.floor(m / 60);
      return { label: `${h}h${String(m % 60).padStart(2, "0")}`, date: `28 mar, ${4 + h}:${String(m % 60).padStart(2, "0")}` };
    },
    "24h": (i) => {
      const h = Math.round((i / (count - 1)) * 24);
      return { label: `${h}h`, date: `${h < 10 ? "28" : "27"} mar, ${String(h).padStart(2, "0")}:00` };
    },
    "7d": (i) => {
      const d = Math.round((i / (count - 1)) * 7);
      const day = 21 + d;
      return { label: `${day} mar`, date: `${day} mar 2026` };
    },
    "30d": (i) => {
      const d = Math.round((i / (count - 1)) * 30);
      const day = (d % 28) + 1;
      const month = d < 28 ? "fev" : "mar";
      return { label: `${day} ${month}`, date: `${day} ${month} 2026` };
    },
    "Tudo": (i) => {
      const d = Math.round((i / (count - 1)) * 90);
      const months = ["jan", "fev", "mar"];
      const mi = Math.min(2, Math.floor(d / 30));
      const day = (d % 30) + 1;
      return { label: `${day} ${months[mi]}`, date: `${day} ${months[mi]} 2026` };
    },
  };

  const labelFn = labels[period] ?? labels["7d"];

  return Array.from({ length: count }, (_, i) => {
    const h = Math.sin(seed * 9301 + i * 4973) * 10000;
    const noise = (h - Math.floor(h)) * 8 - 4;
    const trend = (i / count) * 12;
    const wave = Math.sin(i * 0.25 + seed) * 6;
    const value = Math.min(95, Math.max(25, 62 + wave + noise + trend));
    const { label, date } = labelFn(i);
    return { value, label, date };
  });
}

const PADDING = { top: 16, right: 12, bottom: 28, left: 44 };
const CHART_HEIGHT = 220;

export default function ProbChart({ currentPrice, priceHistory }: { currentPrice?: number; priceHistory?: PricePoint[] }) {
  const [activePeriod, setActivePeriod] = useState<string>("7d");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const hasRealData = priceHistory && priceHistory.length > 0;
  const data = useMemo(
    () => hasRealData ? filterByPeriod(priceHistory, activePeriod) : generateData(activePeriod),
    [hasRealData, priceHistory, activePeriod]
  );
  const lastValue = data[data.length - 1].value;
  const displayValue = currentPrice != null ? Math.round(currentPrice * 100) : Math.round(lastValue);

  // Compute chart geometry
  const values = data.map((d) => d.value);
  const dataMin = Math.floor(Math.min(...values) / 5) * 5;
  const dataMax = Math.ceil(Math.max(...values) / 5) * 5;
  const range = dataMax - dataMin || 1;

  const chartW = 600;
  const plotW = chartW - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const toX = useCallback((i: number) => PADDING.left + (i / (data.length - 1)) * plotW, [data.length, plotW]);
  const toY = useCallback((v: number) => PADDING.top + plotH - ((v - dataMin) / range) * plotH, [plotH, dataMin, range]);

  // Grid lines (Y axis)
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const v = dataMin + (range / gridSteps) * i;
    return { value: v, y: toY(v) };
  });

  // X-axis labels (pick ~6 evenly spaced)
  const xLabelCount = 6;
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
    return { x: toX(idx), label: data[idx].label };
  });

  // Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`)
    .join(" ");

  // Area path
  const areaPath = `${linePath} L${toX(data.length - 1).toFixed(1)},${(PADDING.top + plotH).toFixed(1)} L${PADDING.left},${(PADDING.top + plotH).toFixed(1)} Z`;

  // Smooth path using cubic bezier for better aesthetics
  const smoothPath = useMemo(() => {
    if (data.length < 3) return linePath;
    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }, [data, toX, toY, linePath]);

  const smoothArea = `${smoothPath} L${toX(data.length - 1).toFixed(1)},${(PADDING.top + plotH).toFixed(1)} L${PADDING.left},${(PADDING.top + plotH).toFixed(1)} Z`;

  // High / Low markers
  const highIdx = values.indexOf(Math.max(...values));
  const lowIdx = values.indexOf(Math.min(...values));

  // Hover
  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? toX(hoverIdx) : 0;
  const hoverY = hoverIdx !== null ? toY(data[hoverIdx].value) : 0;

  const firstValue = data[0].value;
  const currentValue = hoverPoint ? hoverPoint.value : lastValue;
  const change = currentValue - firstValue;
  const changePct = firstValue > 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  function resolveIdx(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * chartW;
    const relX = mouseX - PADDING.left;
    const idx = Math.round((relX / plotW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    resolveIdx(e.clientX);
  }

  function handleTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    if (e.touches.length > 0) {
      e.preventDefault();
      resolveIdx(e.touches[0].clientX);
    }
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-text">
            {hoverPoint ? Math.round(hoverPoint.value) : displayValue}%
          </span>
          <span className={`text-sm font-mono font-medium ${isPositive ? "text-up" : "text-down"}`}>
            {isPositive ? "+" : ""}{change.toFixed(1)}pp ({isPositive ? "+" : ""}{changePct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex gap-0.5">
          {PERIODS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => { setActivePeriod(p); setHoverIdx(null); }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activePeriod === p ? "bg-accent/10 text-accent" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Hover date */}
      <div className="h-5 mb-1">
        {hoverPoint ? (
          <span className="text-xs text-text-tertiary">{hoverPoint.date}</span>
        ) : (
          <span className="text-xs text-text-tertiary">Toque ou passe o mouse para ver valores</span>
        )}
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartW} ${CHART_HEIGHT}`}
        className="w-full select-none touch-none"
        style={{ height: CHART_HEIGHT }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2178B5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2178B5" stopOpacity="0" />
          </linearGradient>
          <clipPath id="plotClip">
            <rect x={PADDING.left} y={PADDING.top} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={PADDING.left + plotW}
              y2={g.y}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
            />
            <text
              x={PADDING.left - 8}
              y={g.y + 3.5}
              textAnchor="end"
              className="fill-text-tertiary"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {Math.round(g.value)}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={PADDING.top + plotH + 18}
            textAnchor="middle"
            className="fill-text-tertiary"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {xl.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={smoothArea} fill="url(#areaGrad)" clipPath="url(#plotClip)" />

        {/* Main line */}
        <path
          d={smoothPath}
          fill="none"
          stroke="#2178B5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#plotClip)"
        />

        {/* High marker */}
        <g>
          <circle cx={toX(highIdx)} cy={toY(values[highIdx])} r="3" fill="#2178B5" opacity="0.6" />
          <text
            x={toX(highIdx)}
            y={toY(values[highIdx]) - 8}
            textAnchor="middle"
            className="fill-text-secondary"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fontWeight="600"
          >
            {Math.round(values[highIdx])}%
          </text>
        </g>

        {/* Low marker */}
        <g>
          <circle cx={toX(lowIdx)} cy={toY(values[lowIdx])} r="3" fill="#DC2626" opacity="0.6" />
          <text
            x={toX(lowIdx)}
            y={toY(values[lowIdx]) + 15}
            textAnchor="middle"
            className="fill-text-secondary"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fontWeight="600"
          >
            {Math.round(values[lowIdx])}%
          </text>
        </g>

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <g>
            {/* Vertical line */}
            <line
              x1={hoverX}
              y1={PADDING.top}
              x2={hoverX}
              y2={PADDING.top + plotH}
              stroke="currentColor"
              className="text-border-strong"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {/* Horizontal line */}
            <line
              x1={PADDING.left}
              y1={hoverY}
              x2={PADDING.left + plotW}
              y2={hoverY}
              stroke="currentColor"
              className="text-border-strong"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            {/* Dot */}
            <circle cx={hoverX} cy={hoverY} r="5" fill="#2178B5" opacity="0.2" />
            <circle cx={hoverX} cy={hoverY} r="3" fill="#2178B5" />
            <circle cx={hoverX} cy={hoverY} r="1.5" fill="white" />

            {/* Value label on Y axis */}
            <rect
              x={0}
              y={hoverY - 9}
              width={PADDING.left - 4}
              height={18}
              rx="3"
              fill="#2178B5"
            />
            <text
              x={(PADDING.left - 4) / 2}
              y={hoverY + 3.5}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >
              {Math.round(data[hoverIdx].value)}%
            </text>

            {/* Date label on X axis */}
            <rect
              x={Math.max(PADDING.left, Math.min(hoverX - 30, PADDING.left + plotW - 60))}
              y={PADDING.top + plotH + 2}
              width={60}
              height={18}
              rx="3"
              fill="#2178B5"
            />
            <text
              x={Math.max(PADDING.left + 30, Math.min(hoverX, PADDING.left + plotW - 30))}
              y={PADDING.top + plotH + 14}
              textAnchor="middle"
              fill="white"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="500"
            >
              {data[hoverIdx].label}
            </text>
          </g>
        )}

        {/* Invisible hover area */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          className="cursor-crosshair"
        />
      </svg>

      {/* Legend bar */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-text-tertiary">
        <span>O preço reflete a probabilidade. R$0,78 = 78% de chance.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Máx {Math.round(values[highIdx])}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-down" />
            Mín {Math.round(values[lowIdx])}%
          </span>
        </div>
      </div>
    </div>
  );
}
