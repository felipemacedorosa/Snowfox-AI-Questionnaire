"use client";

import { useRef, useEffect } from "react";

export function PillarBar({ pct, barClass }: { pct: number; barClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => { el.style.width = pct + "%"; });
  }, [pct]);
  return <div ref={ref} className={`rpt-pillar-bar-fill ${barClass}`} style={{ width: "0%" }} />;
}
