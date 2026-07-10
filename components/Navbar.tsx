"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { EASE_INOUT } from "@/lib/motion";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Screen = "landing" | "quiz" | "results";

const ANCHORS = [
  { href: "#pilares", label: "Pilares" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#relatorio", label: "O que você recebe" },
];

export function Navbar({ screen, onStart, onHome, saved }: {
  screen: Screen;
  onStart: () => void;
  onHome: () => void;
  /** Shown on the quiz: progress persists automatically. */
  saved?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeAnd(fn?: () => void) {
    setMenuOpen(false);
    fn?.();
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[200] h-16"
      style={{
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--line-1)",
      }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-16 max-w-landing items-center justify-between px-6">
        <button type="button" onClick={() => closeAnd(onHome)} aria-label="Snowfox AI — início" className="flex-shrink-0">
          <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={120} height={28} style={{ height: 26, width: "auto" }} />
        </button>

        {screen === "landing" && (
          <>
            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {ANCHORS.map(a => (
                <a
                  key={a.href}
                  href={a.href}
                  className="px-3.5 py-2 text-[13.5px] font-medium rounded-[8px] no-underline transition-colors text-[var(--text-m)] hover:text-white hover:bg-[var(--surface-3)]"
                >
                  {a.label}
                </a>
              ))}
              <Button size="md" className="ml-3" onClick={onStart}>
                Iniciar avaliação
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="flex md:hidden flex-col justify-center gap-[5px] w-10 h-10 rounded-[8px] p-1.5"
              style={{ background: menuOpen ? "var(--surface-3)" : "none" }}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(m => !m)}
            >
              {[22, 16, 22].map((w, i) => (
                <span
                  key={i}
                  className="block h-0.5 rounded-sm"
                  style={{
                    width: w,
                    background: "rgba(255,255,255,0.80)",
                    transition: "transform .22s ease, opacity .18s ease",
                    transformOrigin: "center",
                    transform: menuOpen && i === 0 ? "translateY(7px) rotate(45deg)" : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" : undefined,
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_INOUT }}
                  className="absolute left-0 right-0 top-16 md:hidden overflow-hidden"
                  style={{
                    background: "var(--nav-bg)",
                    borderBottom: "1px solid var(--line-1)",
                  }}
                >
                  <div className="flex flex-col gap-1 px-5 py-4">
                    {ANCHORS.map(a => (
                      <a
                        key={a.href}
                        href={a.href}
                        onClick={() => setMenuOpen(false)}
                        className="px-3 py-2.5 text-[14.5px] font-medium rounded-[8px] no-underline text-[var(--text-m)]"
                      >
                        {a.label}
                      </a>
                    ))}
                    <Button size="md" className="mt-2 self-start" onClick={() => closeAnd(onStart)}>
                      Iniciar avaliação
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {screen === "quiz" && saved && (
          <span className="flex items-center gap-2 text-[12px] text-[var(--text-dim)]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="rgba(110,231,183,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
            Progresso salvo automaticamente
          </span>
        )}
      </div>
    </nav>
  );
}
