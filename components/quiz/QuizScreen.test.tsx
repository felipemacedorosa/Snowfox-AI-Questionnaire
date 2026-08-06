import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop questionnaire layout", () => {
  it("anchors the rail left while keeping the panel and form constrained", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const desktopRules = css.match(/@media \(min-width: 981px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

    expect(desktopRules).toContain(".quiz-layout");
    expect(desktopRules).toContain("width: calc(100% - 32px)");
    expect(desktopRules).toContain("margin-inline: 16px");
    expect(desktopRules).toContain("grid-template-columns: 300px minmax(0, 1fr)");
    expect(desktopRules).toContain(".question-panel");
    expect(desktopRules).toContain("width: min(100%, 1200px)");
    expect(desktopRules).toContain("justify-self: center");
    expect(desktopRules).toContain(".question-card > *");
    expect(desktopRules).toContain("width: min(100%, 900px)");
  });
});
