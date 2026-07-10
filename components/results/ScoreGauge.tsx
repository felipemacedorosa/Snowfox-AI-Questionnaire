"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { Tier } from "@/components/ui/Badge";
import { EASE_OUT } from "@/lib/motion";

function polar(c: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
}

/**
 * 270° arc gauge, opening at the bottom. The fill wears the tier mark color —
 * the meter carries severity, not the brand. Digits and arc are driven by the
 * same motion value so they land together.
 */
export function ScoreGauge({ score, tier, size = 220 }: {
  score: number;
  tier: Tier;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? score : 0);
  const rounded = useTransform(mv, v => Math.round(v));
  const dashOffset = useTransform(mv, v => 1 - v / 100);

  useEffect(() => {
    if (reduced) {
      mv.set(score);
      return;
    }
    const controls = animate(mv, score, {
      duration: 1.4,
      delay: 0.3,
      ease: EASE_OUT,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, reduced]);

  const c = size / 2;
  const r = c - 10;
  const [sx, sy] = polar(c, r, 135);
  const [ex, ey] = polar(c, r, 45);
  const arc = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Pontuação ${score} de 100`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d={arc}
          fill="none"
          stroke={`var(--tier-${tier}-mark)`}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display font-black text-white leading-none" style={{ fontSize: size * 0.36, letterSpacing: "-0.04em" }}>
          <motion.span>{rounded}</motion.span>
        </p>
        <p className="mt-1 text-[15px] font-medium text-[var(--text-dim)]">/100</p>
      </div>
    </div>
  );
}
