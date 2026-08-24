import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/app/LanguageContext";
import { Navbar } from "./Navbar";

function render() {
  return renderToStaticMarkup(
    <LanguageProvider>
      <Navbar
        screen="quiz"
        sectionLabel="Dados"
        saveState="idle"
        reportConfirmed={false}
        onSave={() => undefined}
        onBackToStart={() => undefined}
      />
    </LanguageProvider>
  );
}

describe("Navbar brand link", () => {
  it("points the logo at the marketing site", () => {
    const markup = render();
    expect(markup).toContain('href="https://snowfox-ai.com/"');
    expect(markup).toContain("brand-home-link");
  });

  it("labels the link for screen readers", () => {
    // The logo is an image plus styled text, so it needs an explicit label.
    expect(render()).toContain('aria-label="snowfox AI, voltar para o início"');
  });
});
