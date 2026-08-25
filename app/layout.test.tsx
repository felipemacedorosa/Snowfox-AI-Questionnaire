import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const BASE_ENV = "NEXT_PUBLIC_BASE_PATH";

async function renderLayout(basePath: string | undefined) {
  vi.resetModules();
  const previous = process.env[BASE_ENV];
  if (basePath === undefined) delete process.env[BASE_ENV];
  else process.env[BASE_ENV] = basePath;
  try {
    const { default: RootLayout } = await import("./layout");
    return renderToStaticMarkup(<RootLayout>{null}</RootLayout>);
  } finally {
    if (previous === undefined) delete process.env[BASE_ENV];
    else process.env[BASE_ENV] = previous;
  }
}

afterEach(() => vi.resetModules());

describe("favicon", () => {
  it("prefixes the icon with the deployed base path", async () => {
    // Production serves the app from /assessments/ai-readiness. A root-absolute
    // href resolves to the domain root, where the file is not served.
    const markup = await renderLayout("/assessments/ai-readiness");
    expect(markup).toContain('href="/assessments/ai-readiness/fox-icon.png"');
    expect(markup).not.toContain('href="/fox-icon.png"');
  });

  it("still works when no base path is configured", async () => {
    const markup = await renderLayout("");
    expect(markup).toContain('href="/fox-icon.png"');
  });

  it("declares both the browser icon and the touch icon", async () => {
    const markup = await renderLayout("/assessments/ai-readiness");
    expect(markup).toContain('rel="icon"');
    expect(markup).toContain('rel="apple-touch-icon"');
  });
});
