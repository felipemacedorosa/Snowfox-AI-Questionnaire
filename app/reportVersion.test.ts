import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { UI } from "./i18n";
import { REPORT_VERSION } from "./reportVersion";

describe("report version", () => {
  it("uses v1.2.25 in both personalized report headings", () => {
    expect(packageJson.version).toBe("1.2.25");
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(REPORT_VERSION).toBe(packageJson.version);
    expect(UI.pt.results.reportDate("05 de agosto de 2026", REPORT_VERSION)).toBe(
      "Relatório personalizado · 05 de agosto de 2026 · v1.2.25"
    );
    expect(UI.en.results.reportDate("August 5, 2026", REPORT_VERSION)).toBe(
      "Personalized report · August 5, 2026 · v1.2.25"
    );
  });
});

describe("submission error translation", () => {
  // reports.php replies with a Portuguese sentence plus a stable code. The UI
  // must key off the code, or an English reader sees the server's Portuguese.
  const CODES = [
    "storage_unavailable",
    "sheet_sync_unavailable",
    "submission_conflict",
    "invalid_email",
    "invalid_company",
    "invalid_job_title",
    "network_error",
    "invalid_receipt",
  ];

  it("translates every server error code in both languages", () => {
    for (const code of CODES) {
      expect(UI.pt.results.submitErrors[code], `pt ${code}`).toBeTypeOf("string");
      expect(UI.en.results.submitErrors[code], `en ${code}`).toBeTypeOf("string");
      expect(UI.en.results.submitErrors[code]).not.toBe(UI.pt.results.submitErrors[code]);
    }
  });

  it("keeps the English messages free of Portuguese", () => {
    const english = Object.values(UI.en.results.submitErrors).join(" ");
    expect(english.match(/[ãõçáâàéêíóôú]/gi) ?? []).toEqual([]);
  });

  it("covers the same codes in both languages", () => {
    expect(Object.keys(UI.en.results.submitErrors).sort()).toEqual(Object.keys(UI.pt.results.submitErrors).sort());
  });
});

describe("English UI strings", () => {
  // Every English label the reader can see lives in UI.en. A Portuguese string
  // here is invisible to typechecking, so scan the table itself.
  it("contains no Portuguese anywhere in the English table", () => {
    const found: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (typeof value === "string") {
        if (/[ãõçáâàéêíóôú]/i.test(value)) found.push(`${path} => ${value}`);
        return;
      }
      if (typeof value === "function") {
        // Label builders take (score) or (date, version); probe with harmless args.
        try {
          const out = (value as (...args: unknown[]) => unknown)(1, "1.0.0");
          if (typeof out === "string" && /[ãõçáâàéêíóôú]/i.test(out)) found.push(`${path}() => ${out}`);
        } catch {
          // Signature did not match the probe; nothing to assert.
        }
        return;
      }
      if (Array.isArray(value)) return value.forEach((item, i) => walk(item, `${path}[${i}]`));
      if (value && typeof value === "object") {
        return Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`));
      }
    };
    walk(UI.en, "UI.en");

    expect(found).toEqual([]);
  });

  it("defines the same keys in both languages", () => {
    const keys = (value: unknown, prefix = ""): string[] => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
      return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
    };
    expect(keys(UI.en).sort()).toEqual(keys(UI.pt).sort());
  });
});
