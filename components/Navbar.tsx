"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Save } from "lucide-react";
import { useLanguage } from "@/app/LanguageContext";
import type { Lang } from "@/app/i18n";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The marketing site is bilingual too, so send the reader to the matching
// version rather than always dropping them on the Portuguese home page.
const HOME_URL: Record<Lang, string> = {
  pt: "https://snowfox-ai.com/",
  en: "https://snowfox-ai.com/en_us/",
};

export type AppScreen = "quiz" | "results";
export type SaveState = "idle" | "saving" | "saved" | "unavailable";

export function Navbar({
  screen,
  sectionLabel,
  saveState,
  reportConfirmed,
  onSave,
  onBackToStart,
}: {
  screen: AppScreen;
  sectionLabel: string;
  saveState: SaveState;
  reportConfirmed: boolean;
  onSave: () => void;
  onBackToStart: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  const closeMenu = () => setMenuOpen(false);
  const saveLabel = saveState === "saved"
    ? t.nav.saveSaved
    : saveState === "saving"
      ? t.nav.saveSaving
      : saveState === "unavailable"
        ? t.nav.saveUnavailable
        : t.nav.saveIdle;

  return (
    <nav className="site-nav" aria-label={t.nav.mainNavLabel}>
      <div className="nav-inner page-frame">
        <a className="brand-lockup brand-home-link" href={HOME_URL[lang]} aria-label={t.nav.backToHome}>
          <Image src={`${BASE}/fox-icon.png`} alt="" width={30} height={30} priority />
          <span>snowfox <b>AI</b></span>
        </a>

        <div className="nav-context">
          {screen === "quiz" && <><span className="nav-context-label">{t.nav.contextQuiz}</span><span className="nav-context-divider" />{sectionLabel}</>}
          {screen === "results" && <span className="nav-context-label">{reportConfirmed ? t.nav.contextResults : t.nav.contextFinalizeReport}</span>}
        </div>

        <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(current => !current)} aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <div className={`nav-actions${menuOpen ? " is-open" : ""}`}>
          {screen === "quiz" && (
            <button type="button" className={`save-button${saveState === "saved" ? " is-saved" : ""}`} onClick={onSave} disabled={saveState === "saving"}>
              <Save size={15} aria-hidden="true" /> {saveLabel}
            </button>
          )}
          {screen === "results" && (
            <button type="button" className="nav-back-button" onClick={() => { onBackToStart(); closeMenu(); }}>
              <ArrowLeft size={15} aria-hidden="true" /> {t.nav.backToStart}
            </button>
          )}
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label={t.nav.langToggleLabel}
            title={t.nav.langToggleLabel}
          >
            <span className={lang === "pt" ? "is-active" : ""}>PT</span>
            <span className={lang === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
