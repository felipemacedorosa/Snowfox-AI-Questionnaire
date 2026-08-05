import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as release from "./deploymentManifest.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe("deployment manifest", () => {
  it("ships a release verification module", () => {
    expect(release.REPORT_VERSION).toBe("1.2.12");
  });

  it("validates and writes exact deployment identity", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "snowfox-release-"));
    temporaryDirectories.push(output);
    const manifest = release.buildManifest({
      reportVersion: "1.2.12",
      commitSha: "c1c8eb0773de47df3e9e0c856ccf09e6444706f0",
      builtAt: "2026-08-05T14:18:07.000Z",
    });

    await release.writeManifest(output, manifest);

    expect(JSON.parse(await readFile(path.join(output, "deployment.json"), "utf8"))).toEqual(manifest);
    expect(() => release.buildManifest({ ...manifest, reportVersion: "v1.2.12" })).toThrow(/version/i);
    expect(() => release.buildManifest({ ...manifest, commitSha: "short" })).toThrow(/commit/i);
  });

  it("verifies every JS and CSS reference in a static export", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "snowfox-export-"));
    temporaryDirectories.push(output);
    const assetDirectory = path.join(output, "_next/static/chunks");
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(path.join(output, "index.html"), '<link rel="stylesheet" href="/assessments/ai-readiness/_next/static/chunks/site-abc123.css"><script src="/assessments/ai-readiness/_next/static/chunks/app-def456.js"></script>');
    await writeFile(path.join(assetDirectory, "site-abc123.css"), "body{}\n");
    await writeFile(path.join(assetDirectory, "app-def456.js"), "console.log('v1.2.12')\n");

    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).resolves.toMatchObject({
      htmlFiles: 1,
      assets: 2,
    });
    await rm(path.join(assetDirectory, "app-def456.js"));
    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).rejects.toThrow(/missing/i);
  });

  it("rejects a reused production version on a new push but permits recovery dispatch", async () => {
    const published = {
      reportVersion: "1.2.12",
      commitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      builtAt: "2026-08-05T14:18:07.000Z",
    };
    const fetcher = async () => new Response(JSON.stringify(published), { status: 200 });

    await expect(release.checkProductionVersion({
      baseUrl: "https://snowfox-ai.com/assessments/ai-readiness/",
      candidateVersion: "1.2.12",
      candidateSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      eventName: "push",
      fetcher,
    })).rejects.toThrow(/bump/i);
    await expect(release.checkProductionVersion({
      baseUrl: "https://snowfox-ai.com/assessments/ai-readiness/",
      candidateVersion: "1.2.12",
      candidateSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      eventName: "workflow_dispatch",
      fetcher,
    })).resolves.toBeUndefined();
  });
});
