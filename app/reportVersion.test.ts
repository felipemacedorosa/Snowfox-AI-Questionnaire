import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { UI } from "./i18n";
import { REPORT_VERSION } from "./reportVersion";

describe("report version", () => {
  it("uses v1.2.20 in both personalized report headings", () => {
    expect(packageJson.version).toBe("1.2.20");
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(REPORT_VERSION).toBe(packageJson.version);
    expect(UI.pt.results.reportDate("05 de agosto de 2026", REPORT_VERSION)).toBe(
      "Relatório personalizado · 05 de agosto de 2026 · v1.2.20"
    );
    expect(UI.en.results.reportDate("August 5, 2026", REPORT_VERSION)).toBe(
      "Personalized report · August 5, 2026 · v1.2.20"
    );
  });
});
