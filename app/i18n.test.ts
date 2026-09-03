import { describe, expect, it } from "vitest";
import { DEFAULT_LANG, UI, parseLangParam } from "./i18n";

describe("parseLangParam", () => {
  it("opens the assessment in English from the shared English link", () => {
    expect(parseLangParam("?lang=en")).toBe("en");
  });

  it("reads the parameter alongside the UTM parameters a post link carries", () => {
    expect(parseLangParam("?utm_source=linkedin&utm_content=post-assess-033&lang=en")).toBe("en");
  });

  it("accepts Portuguese explicitly, so both audiences can have a link", () => {
    expect(parseLangParam("?lang=pt")).toBe("pt");
  });

  it("ignores case and stray whitespace from a hand-built link", () => {
    expect(parseLangParam("?lang=EN")).toBe("en");
    expect(parseLangParam("?lang=%20en%20")).toBe("en");
  });

  it("accepts the full locale tags a copied link may carry", () => {
    expect(parseLangParam("?lang=en-US")).toBe("en");
    expect(parseLangParam("?lang=pt-BR")).toBe("pt");
  });

  it("says nothing when the link says nothing, leaving the saved preference in charge", () => {
    expect(parseLangParam("")).toBeNull();
    expect(parseLangParam("?utm_source=linkedin")).toBeNull();
    expect(parseLangParam("?lang=")).toBeNull();
    expect(parseLangParam("?lang=fr")).toBeNull();
  });
});

describe("language defaults", () => {
  it("still opens in Portuguese without a lang parameter", () => {
    expect(DEFAULT_LANG).toBe("pt");
  });

  it("has an English translation for every string the Portuguese chrome defines", () => {
    const missing: string[] = [];
    const walk = (pt: unknown, en: unknown, path: string) => {
      if (typeof pt === "object" && pt !== null) {
        for (const key of Object.keys(pt as Record<string, unknown>)) {
          walk(
            (pt as Record<string, unknown>)[key],
            (en as Record<string, unknown> | undefined)?.[key],
            path ? `${path}.${key}` : key
          );
        }
        return;
      }
      if (en === undefined) missing.push(path);
    };
    walk(UI.pt, UI.en, "");
    expect(missing).toEqual([]);
  });
});
