"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Odometer digit ticker: each digit is a vertical 0–9 strip translating inside
 * a 1ch mask. Springs to the current value whenever `value` changes — parents
 * gate the start (e.g. render 0 until in view).
 */
export function Ticker({ value, className }: { value: number | string; className?: string }) {
  const reduced = useReducedMotion();
  const chars = String(value).split("");
  return (
    <span className={cn("inline-flex leading-none", className)} role="text" aria-label={String(value)}>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <Digit key={i} digit={Number(ch)} delay={i * 0.03} instant={!!reduced} />
        ) : (
          <span key={i} aria-hidden="true">{ch}</span>
        ),
      )}
    </span>
  );
}

function Digit({ digit, delay, instant }: { digit: number; delay: number; instant: boolean }) {
  return (
    <span aria-hidden="true" className="inline-block overflow-hidden align-baseline" style={{ height: "1em", width: "1ch" }}>
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-digit}em` }}
        transition={instant ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, delay }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block text-center" style={{ height: "1em" }}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}
