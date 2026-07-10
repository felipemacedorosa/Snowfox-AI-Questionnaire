"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

export function NavBtn({ variant, disabled, onClick, children }: {
  variant: "back" | "next";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (variant === "back") {
    return (
      <button type="button" onClick={onClick} className="button-secondary question-nav-button">
        <ArrowLeft size={16} aria-hidden="true" />
        {children}
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className="button-primary question-nav-button">
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}
