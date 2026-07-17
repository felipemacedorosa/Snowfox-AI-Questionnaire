"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageContext";

export interface ReportChapter {
  id: string;
  number: string;
  label: string;
}

export function ReportNavigation({ chapters }: { chapters: ReportChapter[] }) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    const elements = chapters
      .map(chapter => document.getElementById(chapter.id))
      .filter((element): element is HTMLElement => Boolean(element));
    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = window.scrollY + window.innerHeight * 0.3;
      let current = chapters[0]?.id ?? "";
      for (const element of elements) {
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = element.id;
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

  useEffect(() => {
    const activeLink = document.querySelector<HTMLElement>(`[data-report-chapter="${activeId}"]`);
    const scroller = activeLink?.parentElement;
    if (!activeLink || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollTo({
      left: activeLink.offsetLeft - scroller.clientWidth / 2 + activeLink.clientWidth / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [activeId]);

  return (
    <aside className="report-chapter-nav no-print" aria-label={t.reportNav.chaptersAriaLabel}>
      <span className="report-chapter-nav-title">{t.reportNav.title}</span>
      <nav>
        {chapters.map(chapter => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            data-report-chapter={chapter.id}
            className={activeId === chapter.id ? "is-active" : ""}
            aria-current={activeId === chapter.id ? "location" : undefined}
          >
            <span>{chapter.number}</span>
            <strong>{chapter.label}</strong>
          </a>
        ))}
      </nav>
      <div className="report-chapter-progress" aria-hidden="true">
        <span style={{ height: `${Math.max(1, chapters.findIndex(chapter => chapter.id === activeId) + 1) / chapters.length * 100}%` }} />
      </div>
    </aside>
  );
}
