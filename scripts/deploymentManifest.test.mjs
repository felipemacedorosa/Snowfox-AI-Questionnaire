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
    expect(release.REPORT_VERSION).toBe("1.2.24");
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
    await writeFile(path.join(output, "index.html"), `<link rel="stylesheet" href="/assessments/ai-readiness/_next/static/chunks/site-abc123.css?v=${release.REPORT_VERSION}"><script src="/assessments/ai-readiness/_next/static/chunks/app-def456.js?v=${release.REPORT_VERSION}"></script>`);
    await writeFile(path.join(output, "index.txt"), `"/_next/static/chunks/app-def456.js?v=${release.REPORT_VERSION}"`);
    await writeFile(path.join(assetDirectory, "site-abc123.css"), "body{}\n");
    await writeFile(path.join(assetDirectory, "app-def456.js"), "console.log('v1.2.12')\n");

    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).resolves.toMatchObject({
      htmlFiles: 1,
      assets: 2,
    });
    await rm(path.join(assetDirectory, "app-def456.js"));
    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).rejects.toThrow(/missing/i);
  });

  it("rejects unversioned or incorrectly versioned static asset references", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "snowfox-export-version-"));
    temporaryDirectories.push(output);
    const assetDirectory = path.join(output, "_next/static/chunks");
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(path.join(assetDirectory, "app.js"), "console.log('app')\n");
    await writeFile(path.join(output, "index.html"), '<script src="/assessments/ai-readiness/_next/static/chunks/app.js"></script>');

    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).rejects.toThrow(/release query/i);

    await writeFile(path.join(output, "index.html"), '<script src="/assessments/ai-readiness/_next/static/chunks/app.js?v=0.0.1"></script>');
    await expect(release.verifyStaticExport(output, "/assessments/ai-readiness")).rejects.toThrow(/release query/i);
  });

  it("rejects reused or older versions while permitting recovery of the same release", async () => {
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
    })).rejects.toThrow(/bump/i);
    await expect(release.checkProductionVersion({
      baseUrl: "https://snowfox-ai.com/assessments/ai-readiness/",
      candidateVersion: "1.2.11",
      candidateSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      eventName: "push",
      fetcher,
    })).rejects.toThrow(/newer/i);
    await expect(release.checkProductionVersion({
      baseUrl: "https://snowfox-ai.com/assessments/ai-readiness/",
      candidateVersion: "1.2.12",
      candidateSha: published.commitSha,
      eventName: "workflow_dispatch",
      fetcher,
    })).resolves.toBeUndefined();
  });

  it("requires the production base URL to end in a slash", async () => {
    expect(release).not.toBeNull();
    await expect(release.checkProductionVersion({
      baseUrl: "https://snowfox-ai.com/assessments/ai-readiness",
      candidateVersion: "1.2.12",
      candidateSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      eventName: "push",
      fetcher: async () => new Response(null, { status: 404 }),
    })).rejects.toThrow(/trailing slash/i);
  });

  it("verifies production HTML, route payload, manifest, and immutable assets", async () => {
    const baseUrl = "https://snowfox-ai.com/assessments/ai-readiness/";
    const commitSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const noCache = { "cache-control": "no-cache, no-store, must-revalidate" };
    const immutable = { "cache-control": "public, max-age=31536000, immutable" };
    const requested = [];
    const fetcher = async input => {
      const url = new URL(input);
      requested.push(url);
      if (url.pathname.endsWith("deployment.json")) return new Response(JSON.stringify({ reportVersion: "1.2.12", commitSha, builtAt: "2026-08-05T14:18:07.000Z" }), { status: 200, headers: noCache });
      if (url.pathname.endsWith("index.txt")) return new Response('"/_next/static/chunks/app-def456.js?v=1.2.12"', { status: 200, headers: noCache });
      if (url.pathname.endsWith("app-def456.js")) return new Response("personalizado v1.2.12", { status: 200, headers: immutable });
      if (url.pathname.endsWith("ai-readiness/")) return new Response('<script src="/assessments/ai-readiness/_next/static/chunks/app-def456.js?v=1.2.12"></script>', { status: 200, headers: noCache });
      return new Response(null, { status: 404 });
    };

    await expect(release.verifyProduction({ baseUrl, expectedVersion: "1.2.12", expectedSha: commitSha, fetcher })).resolves.toMatchObject({ assets: 1 });
    expect(requested.some(url => url.pathname === "/assessments/ai-readiness/index.txt")).toBe(true);
    const assetRequest = requested.find(url => url.pathname.endsWith("app-def456.js"));
    expect(assetRequest?.searchParams.get("v")).toBe("1.2.12");
    expect(assetRequest?.searchParams.has("release_check")).toBe(true);
  });

  it("rejects production HTML with a stale static asset release query", async () => {
    const baseUrl = "https://snowfox-ai.com/assessments/ai-readiness/";
    const commitSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const noCache = { "cache-control": "no-cache, no-store, must-revalidate" };
    const fetcher = async input => {
      const url = new URL(input);
      if (url.pathname.endsWith("deployment.json")) return new Response(JSON.stringify({ reportVersion: "1.2.12", commitSha, builtAt: "2026-08-05T14:18:07.000Z" }), { status: 200, headers: noCache });
      if (url.pathname.endsWith("index.txt")) return new Response("route payload", { status: 200, headers: noCache });
      if (url.pathname.endsWith("ai-readiness/")) return new Response('<script src="/assessments/ai-readiness/_next/static/chunks/app.js?v=1.2.11"></script>', { status: 200, headers: noCache });
      return new Response(null, { status: 404 });
    };

    await expect(release.verifyProduction({ baseUrl, expectedVersion: "1.2.12", expectedSha: commitSha, fetcher })).rejects.toThrow(/release query/i);
  });
});
