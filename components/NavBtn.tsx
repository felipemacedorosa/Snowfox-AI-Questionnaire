"use client";

export function NavBtn({ variant, disabled, onClick, children }: {
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
