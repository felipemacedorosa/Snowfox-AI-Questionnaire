"use client";

import { motion } from "motion/react";
import type { QuarterlyRecommendation } from "@/app/resultInsights";
import { EASE_OUT, fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

/** Three-quarter roadmap: horizontal track on desktop, vertical on mobile. */
export function RoadmapTimeline({ items }: { items: QuarterlyRecommendation[] }) {
  return (
    <motion.section
      id="plano"
      className="scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.12)}
      aria-labelledby="plano"
    >
      <SectionHeading number="06" title="Plano de ação" aside="Três trimestres, uma sequência" />

      {/* Track */}
      <motion.div variants={fadeUp} className="relative mt-8 mb-6 hidden md:block" aria-hidden="true">
        <div className="h-[2px] bg-[var(--line-1)] overflow-hidden">
          <motion.div
            className="h-full origin-left"
            style={{ background: "var(--violet-500)" }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          />
        </div>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid grid-cols-3">
          {items.map(item => (
            <span key={item.id} className="flex justify-start pl-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--violet-500)", boxShadow: "0 0 0 3px var(--bg-0)" }}
              />
            </span>
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 max-md:mt-6">
        {items.map((item, i) => (
          <motion.article
            key={item.id}
            variants={fadeUp}
            className="relative rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] p-5 max-md:pl-6"
          >
            {/* Mobile: vertical rule instead of the horizontal track */}
            <span
              aria-hidden="true"
              className="md:hidden absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
              style={{ background: "var(--violet-500)" }}
            />
            <p className="text-[13px] font-semibold text-white">{item.period}</p>
            <p className="text-[11px] mt-0.5 text-[var(--text-dim)]">{item.focus}</p>
            <h3 className="mt-4 text-[15.5px] font-semibold text-white leading-[1.4]">{item.title}</h3>
            <p className="mt-2 text-[13px] leading-[1.65] text-[var(--text-m)]">{item.action}</p>
            <p
              className="mt-4 pl-3 text-[12.5px] leading-[1.6] text-[var(--text-m)]"
              style={{ borderLeft: "2px solid var(--violet-500)" }}
            >
              <span className="font-semibold text-white">Resultado esperado:</span> {item.outcome}.
            </p>

            <dl
              className="mt-4 pt-4 grid grid-cols-2 gap-x-4 gap-y-3"
              style={{ borderTop: "1px solid var(--line-1)" }}
            >
              {[
                ["Responsável sugerido", item.ownerRole],
                ["Esforço", item.effort],
                ["Dependência", item.dependency],
                ["Medida de sucesso", item.successMetric],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)]">{label}</dt>
                  <dd className="mt-0.5 text-[12px] leading-[1.5] text-[var(--text-m)]">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
