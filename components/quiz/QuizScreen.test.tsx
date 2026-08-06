import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop questionnaire layout", () => {
  it("keeps a constrained desktop layout with a moderately wider centered form", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const desktopRules = css.match(/@media \(min-width: 981px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

    expect(desktopRules).toContain(".quiz-layout");
    expect(desktopRules).toContain("width: min(calc(100% - 64px), 1680px)");
    expect(desktopRules).toContain("margin-inline: auto");
    expect(desktopRules).toContain("grid-template-columns: 300px minmax(0, 1fr)");
    expect(desktopRules).toContain(".question-card > *");
    expect(desktopRules).toContain("width: min(100%, 900px)");
  });
});
