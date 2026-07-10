"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { RiskBand, RiskSignal } from "@/app/resultAnalysis";
import type { Tier } from "@/components/ui/Badge";
import { EASE_INOUT, fadeUp, staggerChildren, VIEWPORT_ONCE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";

const BANDS: Array<{ id: RiskBand; label: string; description: string; tier: Tier }> = [
  { id: "blocks-scale", label: "Bloqueia escala", description: "Sinais que limitam avanço confiável agora.", tier: "low" },
  { id: "weakens-delivery", label: "Enfraquece execução", description: "Riscos que reduzem adoção, velocidade ou valor.", tier: "emerging" },
  { id: "monitor", label: "Monitorar e preservar", description: "Forças e sinais que precisam continuar visíveis.", tier: "high" },
];

function SignalCard({ signal, tier, open, onToggle }: {
  signal: RiskSignal;
  tier: Tier;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[12px] border border-[var(--line-1)] bg-[var(--surface-2)] overflow-hidden"
      style={{ borderLeft: `2px solid var(--tier-${tier}-mark)` }}
    >
      <button type="button" className="w-full flex items-center gap-3 px-5 py-4 text-left" aria-expanded={open} onClick={onToggle}>
        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-dim)]">
              {signal.pillarTitle}
            </span>
            <span
              className="text-[10px] font-bold uppercase px-2 py-[2px] rounded-[6px] tracking-[0.04em]"
              style={{ background: `var(--tier-${tier}-bg)`, color: `var(--tier-${tier}-text)` }}
            >
              {signal.urgency}
            </span>
          </span>
          <span className="block text-[14px] font-semibold text-white leading-[1.45]">{signal.title}</span>
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_INOUT }}
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true" className="flex-shrink-0"
        >
          <path d="M3 6l5 5 5-5" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_INOUT }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className="text-[13px] leading-[1.7] text-[var(--text-m)]">{signal.detail}</p>
              {signal.evidence.length > 0 && (
                <div className="mt-3.5 pl-3.5 flex flex-col gap-1.5" style={{ borderLeft: "2px solid var(--line-2)" }}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-p)]">
                    Evidência utilizada
                  </p>
                  {signal.evidence.map((line, index) => (
                    <p key={index} className="text-[12.5px] leading-[1.6] text-[var(--text-dim)]">{line}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Risk signals banded by effect on the ability to scale — with the answers that back each one. */
export function RiskTopology({ signals }: { signals: RiskSignal[] }) {
  const firstBlocking = signals.find(signal => signal.band === "blocks-scale")?.id ?? signals[0]?.id;
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(firstBlocking ? [firstBlocking] : []));

  if (signals.length === 0) return null;

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <motion.section
      id="riscos"
      className="scroll-mt-28"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={staggerChildren(0.08)}
      aria-labelledby="riscos"
    >
      <SectionHeading number="03" title="Topologia de riscos" aside="Urgência sem falsa precisão" />
      <motion.p variants={fadeUp} className="mt-3 mb-6 max-w-[680px] text-[13.5px] leading-[1.65] text-[var(--text-m)]">
        Os sinais são organizados pelo efeito sobre a capacidade de escalar, não por uma
        probabilidade inventada. Abra cada leitura para ver a evidência que a sustenta.
      </motion.p>

      <div className="flex flex-col gap-8">
        {BANDS.map(band => {
          const items = signals.filter(signal => signal.band === band.id);
          return (
            <motion.div key={band.id} variants={fadeUp}>
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  aria-hidden="true"
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: `var(--tier-${band.tier}-mark)` }}
                />
                <h3 className="font-display font-bold text-white text-[16px] tracking-[-0.01em]">{band.label}</h3>
                <span
                  className="text-[11.5px] font-bold px-2 py-[2px] rounded-[6px]"
                  style={{ background: `var(--tier-${band.tier}-bg)`, color: `var(--tier-${band.tier}-text)` }}
                >
                  {items.length}
                </span>
                <span className="text-[12px] text-[var(--text-dim)]">{band.description}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-[12.5px] text-[var(--text-p)] pl-[18px]">Nenhum sinal selecionado nesta faixa.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {items.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      tier={band.tier}
                      open={openIds.has(signal.id)}
                      onToggle={() => toggle(signal.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
