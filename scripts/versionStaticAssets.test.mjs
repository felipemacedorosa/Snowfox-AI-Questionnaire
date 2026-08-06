import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { versionStaticAssetUrls } from "./versionStaticAssets.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe("versionStaticAssetUrls", () => {
  it("adds a release query to JS and CSS references in HTML and route payloads", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "snowfox-assets-"));
    temporaryDirectories.push(output);
    await mkdir(path.join(output, "nested"), { recursive: true });
    await writeFile(path.join(output, "index.html"), [
      '<link href="/assessments/ai-readiness/_next/static/chunks/site.css" rel="stylesheet">',
      '<script src="/assessments/ai-readiness/_next/static/chunks/app.js"></script>',
      '<img src="/assessments/ai-readiness/logo.png">',
    ].join(""));
    await writeFile(path.join(output, "nested/route.txt"), '"/_next/static/chunks/lazy.js"');

    await expect(versionStaticAssetUrls(output, "9.8.7")).resolves.toMatchObject({ filesChanged: 2, referencesVersioned: 3 });
    expect(await readFile(path.join(output, "index.html"), "utf8")).toContain("site.css?v=9.8.7");
    expect(await readFile(path.join(output, "index.html"), "utf8")).toContain("app.js?v=9.8.7");
    expect(await readFile(path.join(output, "index.html"), "utf8")).toContain('logo.png"');
    expect(await readFile(path.join(output, "nested/route.txt"), "utf8")).toContain("lazy.js?v=9.8.7");

    await expect(versionStaticAssetUrls(output, "9.8.7")).resolves.toMatchObject({ filesChanged: 0, referencesVersioned: 0 });
  });
});
