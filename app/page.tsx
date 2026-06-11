"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { BeamsBackground } from "@/components/ui/beams-background";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import {
  SECTIONS, TOTAL_Q, PILLAR_CONFIG, LEVEL_META, RECOMMENDATIONS,
  calculatePillarScores, calculateWeightedScore, applyBlockerRules, getPillarTier,
} from "./data";

type Screen = "quiz" | "results";

// ─── Shared nav ───────────────────────────────────────────────────────────────
function Navbar({ screen, onSave }: { screen: Screen; onSave: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    onSave();
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[200] h-16"
      style={{ background: "rgba(5,1,22,0.86)", backdropFilter: "blur(28px)", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}
      aria-label="Main navigation"
    >
      <div style={{ maxWidth: "100%", paddingInline: "clamp(20px,4vw,72px)" }}>
        <div className="flex h-16 items-center justify-between">
          <a href="/" aria-label="Snowfox AI">
            <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={120} height={28} style={{ height: 28, width: "auto" }} />
          </a>

          <button
            className="flex flex-col justify-center gap-[5px] w-10 h-10 rounded-lg p-1.5 md:hidden"
            style={{ background: menuOpen ? "rgba(255,255,255,0.06)" : "none" }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(m => !m)}
          >
            {[22, 16, 22].map((w, i) => (
              <span key={i} className="block h-0.5 rounded-sm" style={{
                width: w,
                background: "rgba(255,255,255,0.80)",
                transition: "transform .22s ease, opacity .18s ease",
                transformOrigin: "center",
                transform: menuOpen && i === 0 ? "translateY(7px) rotate(45deg)" : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" : undefined,
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>

          <ul
            className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row items-start md:items-center list-none gap-0.5
              md:static absolute top-16 left-0 right-0
              md:bg-transparent md:border-0 md:p-0 md:shadow-none
            `}
            style={menuOpen ? { background: "rgba(5,1,22,0.97)", backdropFilter: "blur(28px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px 16px" } : {}}
            role="list"
          >
            {["About","Services","Solutions","Success Cases","Talk to a specialist"].map(item => (
              <li key={item}>
                <a href="#" className="flex items-center gap-1 px-3.5 py-2 md:py-2 text-[14.5px] font-medium rounded-lg no-underline transition-colors w-full md:w-auto"
                  style={{ color: "rgba(255,255,255,0.76)", fontFamily: "Poppins, sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.76)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >{item}</a>
              </li>
            ))}

            {screen === "quiz" && (
              <li>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 text-xs font-medium rounded-full min-h-[36px] px-4 py-1.5 transition-colors"
                  style={{
                    border: saved ? "1px solid rgba(110,231,183,0.35)" : "1px solid rgba(255,255,255,0.11)",
                    background: saved ? "rgba(110,231,183,0.06)" : "rgba(255,255,255,0.04)",
                    color: saved ? "#6ee7b7" : "rgba(210,198,255,0.82)",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M13 14.5H3a1 1 0 01-1-1V2.5a1 1 0 011-1h8l3 3v9.5a1 1 0 01-1 1z"/>
                    <path d="M10.5 1.5V5.5H4V1.5M4 14.5v-5h8v5"/>
                  </svg>
                  {saved ? "Saved" : "Save progress"}
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// ─── Quiz screen ──────────────────────────────────────────────────────────────
function QuizScreen({ section, answers, onAnswer, onBack, onNext }: {
  section: number;
  answers: Record<string, number>;
  onAnswer: (qid: string, val: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sec = SECTIONS[section];
  const isLast = section === SECTIONS.length - 1;
  const answeredTotal = Object.keys(answers).length;
  const sectionDone = sec.questions.every(q => answers[q.id] !== undefined);

  let globalNum = 1;
  for (let i = 0; i < section; i++) globalNum += SECTIONS[i].questions.length;

  return (
    <div>
      <div className="glass-card">
        {/* Progress */}
        <div className="mb-9" role="status" aria-live="polite"
          aria-label={`Progress: Pillar ${sec.pillar} of ${SECTIONS.length}, ${answeredTotal} of ${TOTAL_Q} answered`}>
          <div className="flex gap-[5px] mb-3.5">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`progress-seg${i < section ? " done" : i === section ? " active" : ""}`} role="presentation" />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-m)" }}>
              Pillar {sec.pillar} / {SECTIONS.length} — {sec.title}
            </span>
            <span className="text-[12px] whitespace-nowrap" style={{ color: "rgba(190,175,245,0.50)" }}>
              {answeredTotal} / {TOTAL_Q} answered
            </span>
          </div>
        </div>

        {/* Section header */}
        <div className="pb-7 mb-9" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.65)" }}>
            Pillar {sec.pillar} of {SECTIONS.length}
          </p>
          <h2 className="text-[clamp(22px,4vw,30px)] font-bold leading-[1.25] mb-2.5">
            <span style={{ color: "#ffffff" }}>{sec.title}</span>
          </h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: "var(--text-m)" }}>{sec.desc}</p>
        </div>

        {/* Questions */}
        <div className="flex flex-col">
          {sec.questions.map((q, qi) => {
            const num = globalNum + qi;
            const selected = answers[q.id];
            return (
              <div key={q.id} className="py-7 first:pt-0 last:pb-0" style={{ borderBottom: qi < sec.questions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <p className="text-[10.5px] font-bold tracking-[0.10em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.48)" }}>
                  Question {num} of {TOTAL_Q}
                </p>
                <p className="text-[16px] font-medium leading-[1.65] mb-[22px]" style={{ color: "var(--text-h)" }}>{q.text}</p>
                <div className="flex flex-col gap-2" role="group" aria-label={`Maturity score for question ${num}`}>
                  {q.options.map(opt => {
                    const isSel = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`option-card${isSel ? " selected" : ""}`}
                        aria-pressed={isSel}
                        onClick={() => onAnswer(q.id, isSel ? -1 : opt.value)}
                      >
                        <span className="flex-shrink-0 w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-all"
                          style={isSel
                            ? { background: "var(--grad)", border: "1px solid transparent", color: "#fff" }
                            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(190,175,245,0.50)" }}>
                          {opt.value}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-semibold mb-0.5 leading-[1.3] transition-colors"
                            style={{ color: isSel ? "var(--text-h)" : "var(--text-m)" }}>{opt.label}</span>
                          <span className="block text-[12px] leading-[1.5] transition-colors"
                            style={{ color: isSel ? "rgba(210,198,255,0.72)" : "rgba(190,175,245,0.50)" }}>{opt.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-8 mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {section > 0 ? <NavBtn variant="back" onClick={onBack}>Back</NavBtn> : <span />}
          <span className={`text-[12px] flex-1 text-center${sectionDone ? " text-[rgba(110,231,183,0.80)]" : ""}`}
            style={{ color: sectionDone ? undefined : "rgba(190,175,245,0.50)" }}>
            {sectionDone ? "All questions answered — ready to continue" : "Answer all questions to continue"}
          </span>
          <NavBtn variant="next" disabled={!sectionDone} onClick={onNext}>
            {isLast ? "Complete Assessment" : "Next Section"}
          </NavBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({ answers, onRestart }: {
  answers: Record<string, number>;
  onRestart: () => void;
}) {
  const scoreNumRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const pillarScores = calculatePillarScores(answers);
  const weighted = calculateWeightedScore(pillarScores);
  const result = applyBlockerRules(weighted, pillarScores);
  const strongest = pillarScores.reduce((a, b) => b.score > a.score ? b : a);
  const weakest = pillarScores.reduce((a, b) => b.score < a.score ? b : a);
  const rec = RECOMMENDATIONS[weakest.id] || "";
  const meta = LEVEL_META[result.level];
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    const el = scoreNumRef.current;
    const bar = barRef.current;
    if (!el) return;
    const duration = 1100;
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el!.textContent = String(Math.round(ease * weighted));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if (bar) requestAnimationFrame(() => { bar.style.width = weighted + "%"; });
  }, [weighted]);

  return (
    <div className="flex flex-col items-center pb-16">
      <div className="print-root flex flex-col items-center pb-16">
      <div className="report-wrap">
        {/* Cover */}
        <div className="rpt-cover">
          <div className="flex items-center justify-between mb-9 relative z-[1]">
            <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={88} height={22} style={{ height: 22, width: "auto" }} />
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold tracking-[0.20em] uppercase" style={{ color: "rgba(255,255,255,0.30)" }}>AI Readiness Assessment</span>
              <button
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-1.5 px-3.5 h-[30px] rounded-[7px] text-[11px] font-semibold tracking-[0.02em] transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", fontFamily: "Poppins, sans-serif" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
                  <path d="M8 2v7M5 6l3 3 3-3"/>
                </svg>
                Download PDF
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.20em] uppercase mb-3.5 relative z-[1]" style={{ color: "rgba(167,139,250,0.80)" }}>Readiness Score</p>
          <div className="flex items-baseline gap-2 mb-4 relative z-[1]">
            <span ref={scoreNumRef} className="text-[76px] font-black leading-none tracking-[-0.04em] text-white" style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>0</span>
            <span className="text-[20px] font-medium self-end pb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>/100</span>
          </div>
          <div className="h-[3px] rounded-sm mb-5 relative z-[1]" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div ref={barRef} className="h-full rounded-sm" style={{ width: "0%", background: "linear-gradient(90deg,#8E2DE2,#a855f7)", transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          <span className={`inline-flex items-center px-4 py-[5px] rounded-[20px] text-[11px] font-bold tracking-[0.06em] relative z-[1] rpt-level-tag ${meta.key}`}
            style={meta.key === "low" ? { background: "rgba(239,68,68,0.20)", border: "1px solid rgba(239,68,68,0.45)", color: "rgba(252,165,165,1)" }
              : meta.key === "emerging" ? { background: "rgba(251,146,60,0.18)", border: "1px solid rgba(251,146,60,0.42)", color: "rgba(253,186,116,1)" }
              : meta.key === "moderate" ? { background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.42)", color: "rgba(196,181,253,1)" }
              : meta.key === "high" ? { background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.42)", color: "rgba(110,231,183,1)" }
              : { background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.40)", color: "rgba(103,232,249,1)" }}
          >{result.level}</span>
          <div className="flex gap-11 mt-6 relative z-[1]">
            <div>
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: "rgba(167,139,250,0.70)" }}>Date</p>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.72)", fontFamily: "Poppins, sans-serif" }}>{dateStr}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div>
          {/* 01 Executive Summary */}
          <div className="rpt-section">
            <div className="rpt-sechead">
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>01</span>
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Executive Summary</span>
            </div>
            <p className="text-[14.5px] leading-[1.72] mb-4" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{meta.desc}</p>
            {result.blocker && (
              <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 mb-4 text-[12.5px] leading-[1.55]"
                style={{ background: "#FFFBEF", border: "1px solid rgba(168,120,15,0.40)", color: "#7A5A0C", fontFamily: "Poppins, sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0 mt-px" style={{ color: "#A8780F" }}><circle cx="8" cy="8" r="7"/><path d="M8 5v3"/><circle cx="8" cy="11.5" r=".6" fill="currentColor" stroke="none"/></svg>
                {result.blocker}
              </div>
            )}
            <div className="rpt-kpis">
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#6D28D9", whiteSpace: "nowrap" }}>{weighted} / 100</p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>AI Readiness Score</p>
              </div>
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#171221", whiteSpace: "nowrap" }}>{result.level}</p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>Readiness Level</p>
              </div>
              <div className="rpt-kpi">
                <p style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#171221" }}>{TOTAL_Q}</p>
                <p className="text-[9.5px] uppercase tracking-[0.08em] font-semibold mt-1 leading-[1.4]" style={{ color: "#9A95AB" }}>Questions Answered</p>
              </div>
            </div>
          </div>

          {/* 02 Pillar Breakdown */}
          <div className="rpt-section">
            <div className="rpt-sechead">
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>02</span>
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Pillar Breakdown</span>
              <span className="ml-auto text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9A95AB" }}>5 dimensions</span>
            </div>
            <div>
              {pillarScores.map((p, i) => {
                const tier = getPillarTier(p.score);
                return (
                  <div key={p.id} className="grid items-center gap-[18px] py-3.5"
                    style={{ gridTemplateColumns: "1fr 56px", borderBottom: i < pillarScores.length - 1 ? "1px solid #F1EFF7" : "none" }}>
                    <div>
                      <p className="text-[13px] font-semibold mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{p.title}</p>
                      <div className="h-1 rounded-sm overflow-hidden" style={{ background: "#E7E4F0" }}>
                        <PillarBar pct={p.score} barClass={tier.barClass} />
                      </div>
                      <p className="text-[10.5px] font-semibold mt-1.5 tracking-[0.02em]" style={{ color: "#9A95AB" }}>{tier.label}</p>
                    </div>
                    <p className={`text-[19px] font-black tracking-[-0.03em] text-right ${tier.pctClass}`}
                      style={{ fontFamily: "'Typo Grotesk', sans-serif" }}>{p.score}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 03 Key Insights */}
          <div className="rpt-section">
            <div className="rpt-sechead">
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>03</span>
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Key Insights</span>
            </div>
            <ol className="list-none">
              {[
                { sign: "+", type: "Strongest Area", typeColor: "#1F9D6B", numColor: "#1F9D6B", p: strongest, scoreNote: `Your organization's strongest AI readiness foundation, scoring ${strongest.score}%.` },
                { sign: "−", type: "Biggest Gap",    typeColor: "#CF3F54", numColor: "#CF3F54", p: weakest,   scoreNote: `At ${weakest.score}%, this area should be addressed before scaling AI initiatives.` },
              ].map((item, i) => (
                <li key={i} className="flex gap-[22px] py-[18px]" style={{ borderTop: "1px solid #F1EFF7", borderBottom: i === 1 ? "1px solid #F1EFF7" : "none" }}>
                  <span className="text-[20px] font-black leading-none min-w-[28px] tracking-[-0.04em]" style={{ fontFamily: "'Typo Grotesk', sans-serif", color: item.numColor }}>{item.sign}</span>
                  <div>
                    <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: item.typeColor }}>{item.type}</p>
                    <p className="text-[14px] font-semibold mb-1" style={{ fontFamily: "Poppins, sans-serif", color: "#171221" }}>{item.p.title}</p>
                    <p className="text-[12.5px] leading-[1.58]" style={{ color: "#56516A", fontFamily: "Poppins, sans-serif" }}>{item.scoreNote}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 04 Recommended Action */}
          <div className="rpt-section">
            <div className="rpt-sechead">
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#6D28D9" }}>04</span>
              <span style={{ fontFamily: "'Typo Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#171221" }}>Recommended Next Step</span>
            </div>
            <div className="rounded-[10px] p-5" style={{ background: "#FAF9FD", border: "1px solid #E7E4F0" }}>
              <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: "#6D28D9" }}>Priority Action</p>
              <p className="text-[13.5px] leading-[1.70]" style={{ fontFamily: "Poppins, sans-serif", color: "#56516A" }}>{rec}</p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="rpt-footer">
          <p className="text-[13px] no-print" style={{ color: "#9A95AB" }}>Ready to turn these insights into a concrete AI roadmap?</p>
          <button className="no-print inline-flex items-center gap-2.5 px-9 h-[50px] rounded-[10px] text-[14px] font-semibold tracking-[0.03em] text-white cursor-pointer border-none transition-all"
            style={{ background: "linear-gradient(135deg,#6D28D9,#4A00E0)", boxShadow: "0 4px 20px rgba(109,40,217,0.36)", fontFamily: "Poppins, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(109,40,217,0.50)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(109,40,217,0.36)"; }}
          >
            Talk to a Snowfox AI Specialist
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </button>
          <button onClick={onRestart} className="no-print inline-flex items-center gap-2 px-5 h-[38px] rounded-[8px] text-[12.5px] font-medium cursor-pointer transition-all"
            style={{ border: "1px solid #E7E4F0", background: "#fff", color: "#9A95AB", fontFamily: "Poppins, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#9A95AB"; (e.currentTarget as HTMLElement).style.color = "#56516A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E7E4F0"; (e.currentTarget as HTMLElement).style.color = "#9A95AB"; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 8a6 6 0 116 6"/><path d="M2 8V4M2 8H6"/></svg>
            Retake Assessment
          </button>
          <p className="text-[9.5px] tracking-[0.08em] w-full pt-3.5 text-center" style={{ color: "#C0BBCF", borderTop: "1px solid #E7E4F0" }}>
            SnowFox AI · snowfox-ai.com
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Pillar bar (animated on mount) ──────────────────────────────────────────
function PillarBar({ pct, barClass }: { pct: number; barClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => { el.style.width = pct + "%"; });
  }, [pct]);
  return <div ref={ref} className={`rpt-pillar-bar-fill ${barClass}`} style={{ width: "0%" }} />;
}

// ─── Shared nav buttons ───────────────────────────────────────────────────────
function NavBtn({ variant, disabled, onClick, children }: {
  variant: "back" | "next";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (variant === "back") {
    return (
      <button onClick={onClick} className="flex items-center gap-2 px-[22px] h-12 rounded-[10px] text-[14px] font-medium flex-shrink-0 transition-all"
        style={{ border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.04)", color: "var(--text-m)", fontFamily: "Poppins, sans-serif" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.30)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.13)"; (e.currentTarget as HTMLElement).style.color = "var(--text-m)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-7 h-12 rounded-[10px] text-[14px] font-semibold tracking-[0.03em] text-white flex-shrink-0 transition-all disabled:opacity-[0.36] disabled:cursor-not-allowed"
      style={{ background: "var(--grad)", boxShadow: "0 2px 18px rgba(142,45,226,0.38)", fontFamily: "Poppins, sans-serif" }}
      onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(142,45,226,0.48)"; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 18px rgba(142,45,226,0.38)"; }}
    >
      {children}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
    </button>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState<Screen>("quiz");
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleAnswer = useCallback((qid: string, val: number) => {
    setAnswers(prev => {
      if (val === -1) { const next = { ...prev }; delete next[qid]; return next; }
      return { ...prev, [qid]: val };
    });
  }, []);

  function goTo(s: Screen) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen(s);
  }

  return (
    <>
      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <BeamsBackground intensity="strong" />
      </div>

      <div className="relative min-h-screen" style={{ zIndex: 10 }}>
        <Navbar screen={screen} onSave={() => {}} />

        <div className="flex justify-center pt-16">
          <div className="w-full px-5 py-9 pb-[72px]" style={{ maxWidth: "1100px" }}>

            {screen === "quiz" && (
              <QuizScreen
                key={section}
                section={section}
                answers={answers}
                onAnswer={handleAnswer}
                onBack={() => section === 0 ? undefined : setSection(s => s - 1)}
                onNext={() => {
                  if (section === SECTIONS.length - 1) goTo("results");
                  else setSection(s => s + 1);
                }}
              />
            )}

            {screen === "results" && (
              <ResultsScreen
                answers={answers}
                onRestart={() => {
                  setAnswers({});
                  setSection(0);
                  goTo("quiz");
                }}
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
}
