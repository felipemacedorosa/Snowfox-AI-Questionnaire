"use client";

import { useEffect, useState } from "react";

export interface ReportChapter {
  id: string;
  number: string;
  label: string;
}

/**
 * Scroll-spy chapter rail. Fixed at the left margin on wide screens; hidden
 * below xl (the report reads linearly there).
 */
export function ChapterNav({ chapters }: { chapters: ReportChapter[] }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = window.scrollY + window.innerHeight * 0.3;
      let current = chapters[0]?.id ?? "";
      for (const chapter of chapters) {
        const el = document.getElementById(chapter.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = chapter.id;
        else break;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [chapters]);

  const activeIndex = Math.max(0, chapters.findIndex(chapter => chapter.id === activeId));

  return (
    <aside
      className="hidden xl:block fixed top-32 z-40"
      style={{ left: "max(20px, calc(50vw - 520px - 176px))", width: 152 }}
      aria-label="Capítulos do relatório"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-p)] mb-3 pl-4">
        Relatório
      </p>
      <div className="relative">
        {/* Progress track */}
        <span aria-hidden="true" className="absolute left-0 top-1 bottom-1 w-[2px] bg-[var(--line-1)]">
          <span
            className="block w-full transition-[height] duration-300"
            style={{ height: `${((activeIndex + 1) / chapters.length) * 100}%`, background: "var(--violet-500)" }}
          />
        </span>
        <nav className="flex flex-col gap-1 pl-4">
          {chapters.map(chapter => {
            const isActive = chapter.id === activeId;
            return (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                aria-current={isActive ? "location" : undefined}
                className="flex items-baseline gap-2.5 py-1 no-underline transition-colors"
              >
                <span
                  className="font-display font-bold text-[11px]"
                  style={{ color: isActive ? "var(--violet-400)" : "var(--text-p)" }}
                >
                  {chapter.number}
                </span>
                <span
                  className="text-[12.5px] font-medium leading-tight"
                  style={{ color: isActive ? "var(--text-h)" : "var(--text-dim)" }}
                >
                  {chapter.label}
                </span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
