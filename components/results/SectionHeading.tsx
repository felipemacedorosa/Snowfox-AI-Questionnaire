"use client";

import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";

/** Numbered chapter heading — mirrors the landing's numeral language. */
export function SectionHeading({ number, title, aside }: {
  number: string;
  title: string;
  aside?: string;
}) {
  return (
    <motion.div variants={fadeUp} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h2 className="flex items-baseline gap-3.5 font-display font-bold text-white text-[24px] tracking-[-0.02em]">
        <span aria-hidden="true" className="font-display font-bold text-[14px]" style={{ color: "var(--violet-400)" }}>
          {number}
        </span>
        {title}
      </h2>
      {aside && <span className="text-[12px] text-[var(--text-dim)]">{aside}</span>}
    </motion.div>
  );
}
