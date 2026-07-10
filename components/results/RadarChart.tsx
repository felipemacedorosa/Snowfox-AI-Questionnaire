"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getPillarTier } from "@/app/data";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface RadarDatum {
  label: string;
  value: number; // 0–100
}

const RING_LEVELS = [0.25, 0.5, 0.75, 1];
/** Slow organic spring for polygon morphs (landing profile cycling). */
const MORPH_SPRING = { type: "spring", stiffness: 60, damping: 20 } as const;

function polar(c: number, r: number, i: number, n: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [c + r * Math.cos(angle), c + r * Math.sin(angle)];
}

/**
 * Hand-rolled 5-axis radar. Single series: direct-labeled vertices, no legend.
 * Text wears text tokens; the polygon is the only colored mark.
 * When `data` values change, the polygon morphs with a slow spring.
 */
export function RadarChart({
  data,
  size = 340,
  labelled = true,
  showValues = true,
  animate = true,
  interactive = true,
  className,
}: {
  data: RadarDatum[];
  size?: number;
  labelled?: boolean;
  showValues?: boolean;
  animate?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const doAnimate = animate && !reduced;

  const n = data.length;
  const c = size / 2;
  const pad = labelled ? 56 : 12;
  const R = c - pad;

  const vertex = (i: number) => polar(c, (R * Math.max(0, Math.min(100, data[i].value))) / 100, i, n);
  const d =
    data.map((_, i) => {
      const [x, y] = vertex(i);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z";

  return (
    <div className={cn("relative", className)} style={{ maxWidth: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        role="img"
        aria-label={`Gráfico de radar dos 5 pilares: ${data.map(p => `${p.label} ${p.value} de 100`).join(", ")}`}
        style={{ overflow: "visible" }}
      >
        {/* Grid rings + spokes — recessive hairlines, never dashed */}
        {RING_LEVELS.map(level => (
          <polygon
            key={level}
            points={data.map((_, i) => polar(c, R * level, i, n).map(v => v.toFixed(2)).join(",")).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        ))}
        {data.map((_, i) => {
          const [x, y] = polar(c, R, i, n);
          return (
            <line
              key={i}
              x1={c} y1={c} x2={x} y2={y}
              stroke={hovered === i ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.07)"}
              strokeWidth="1"
              style={{ transition: "stroke .15s ease" }}
            />
          );
        })}

        {/* Data polygon: wash fill + drawn stroke; `d` morphs on value change */}
        <motion.path
          initial={doAnimate ? { opacity: 0, d } : { d }}
          animate={{ opacity: 1, d }}
          transition={{ opacity: { duration: 0.4, delay: 0.8 }, d: MORPH_SPRING }}
          fill="rgba(142,45,226,0.12)"
          stroke="none"
        />
        <motion.path
          initial={doAnimate ? { pathLength: 0, opacity: 0, d } : { d }}
          animate={{ pathLength: 1, opacity: 1, d }}
          transition={{
            pathLength: { duration: 0.9, ease: EASE_OUT, delay: 0.4 },
            opacity: { duration: 0.2, delay: 0.4 },
            d: MORPH_SPRING,
          }}
          fill="none"
          stroke="var(--violet-400)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Vertex dots: 8px mark + 2px surface ring; ≥24px hit target */}
        {data.map((p, i) => {
          const [x, y] = vertex(i);
          return (
            <g key={p.label}>
              <motion.circle
                initial={doAnimate ? { scale: 0, opacity: 0, cx: x, cy: y } : { cx: x, cy: y }}
                animate={{ scale: 1, opacity: 1, cx: x, cy: y }}
                transition={{
                  scale: { type: "spring", stiffness: 420, damping: 30, delay: 0.9 + i * 0.06 },
                  opacity: { duration: 0.15, delay: 0.9 + i * 0.06 },
                  cx: MORPH_SPRING, cy: MORPH_SPRING,
                }}
                r={4}
                fill="var(--violet-400)"
                stroke="var(--bg-0)"
                strokeWidth="2"
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {interactive && (
                <motion.circle
                  initial={{ cx: x, cy: y }}
                  animate={{ cx: x, cy: y }}
                  transition={{ cx: MORPH_SPRING, cy: MORPH_SPRING }}
                  r={14}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${p.label}: ${p.value} de 100 — ${getPillarTier(p.value).label}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  style={{ outline: "none", cursor: "default" }}
                />
              )}
            </g>
          );
        })}

        {/* Direct labels at the axis ends */}
        {labelled &&
          data.map((p, i) => {
            const [x, y] = polar(c, R + 22, i, n);
            const cos = Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n);
            const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
            const isTop = i === 0;
            return (
              <text
                key={p.label}
                x={x}
                y={y + (isTop ? -6 : 4)}
                textAnchor={anchor}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <tspan fontSize="12" fontWeight="500" fill="var(--text-m)">{p.label}</tspan>
                {showValues && (
                  <tspan
                    dx="6"
                    fontSize="13"
                    fontWeight="700"
                    fill="var(--text-h)"
                    style={{ fontFamily: "'Typo Grotesk', sans-serif" }}
                  >
                    {p.value}
                  </tspan>
                )}
              </text>
            );
          })}
      </svg>

      {/* Hover / focus tooltip */}
      {interactive && hovered !== null && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-[8px] whitespace-nowrap"
          style={{
            left: `${(vertex(hovered)[0] / size) * 100}%`,
            top: `${(vertex(hovered)[1] / size) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
            background: "var(--surface-1)",
            border: "1px solid var(--line-3)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          }}
        >
          <p className="text-[12px] font-semibold text-[var(--text-h)]">
            {data[hovered].label} · {data[hovered].value}/100
          </p>
          <p className="text-[11px] text-[var(--text-dim)]">{getPillarTier(data[hovered].value).label}</p>
        </div>
      )}

      {/* Screen-reader table twin */}
      <table className="sr-only">
        <caption>Pontuação por pilar</caption>
        <thead>
          <tr><th scope="col">Pilar</th><th scope="col">Pontuação (0–100)</th></tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.label}><th scope="row">{p.label}</th><td>{p.value}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
