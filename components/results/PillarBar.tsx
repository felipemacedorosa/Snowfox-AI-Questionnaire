/** Print-only pillar bar — static width, no animation. */
export function PillarBar({ pct, barClass }: { pct: number; barClass: string }) {
  return <div className={`rpt-pillar-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />;
}
