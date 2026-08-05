import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const SEMVER = /^\d+\.\d+\.\d+$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/i;

export const REPORT_VERSION = packageJson.version;

export function buildManifest({ reportVersion, commitSha, builtAt }) {
  if (!SEMVER.test(reportVersion)) throw new Error("Report version must be semantic x.y.z.");
  if (!COMMIT_SHA.test(commitSha)) throw new Error("Commit SHA must contain 40 hexadecimal characters.");
  if (typeof builtAt !== "string" || !Number.isFinite(Date.parse(builtAt))) throw new Error("Build timestamp must be a valid ISO date.");
  return { reportVersion, commitSha: commitSha.toLowerCase(), builtAt };
}

export async function writeManifest(outputDirectory, metadata) {
  const manifest = buildManifest(metadata);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "deployment.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

export function extractStaticAssetPaths(html, basePath) {
  const normalizedBase = `/${basePath.split("/").filter(Boolean).join("/")}`;
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi)];
  const assets = new Set();
  for (const [, reference] of references) {
    const pathname = new URL(reference, "https://snowfox.invalid/").pathname;
    const prefix = `${normalizedBase}/`;
    if (!pathname.startsWith(prefix)) continue;
    const relative = pathname.slice(prefix.length);
    if (relative.startsWith("_next/static/") && /\.(?:js|css)$/i.test(relative)) assets.add(relative);
  }
  return [...assets].sort();
}

export async function verifyStaticExport(outputDirectory, basePath) {
  const files = await filesUnder(outputDirectory);
  const htmlFiles = files.filter(file => file.endsWith(".html"));
  if (htmlFiles.length === 0) throw new Error("Static export has no HTML files.");
  const assets = new Set();
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    for (const asset of extractStaticAssetPaths(html, basePath)) assets.add(asset);
  }
  if (assets.size === 0) throw new Error("Static export has no referenced JS/CSS assets.");
  const missing = [...assets].filter(asset => !existsSync(path.join(outputDirectory, asset)));
  if (missing.length > 0) throw new Error(`Static export references missing assets: ${missing.join(", ")}`);
  return { htmlFiles: htmlFiles.length, assets: assets.size };
}

function cacheBusted(url) {
  const target = new URL(url);
  target.searchParams.set("release_check", Date.now().toString());
  return target;
}

async function fetchJson(response, label) {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} did not return valid JSON.`);
  }
}

export async function checkProductionVersion({ baseUrl, candidateVersion, candidateSha, eventName, fetcher = fetch }) {
  buildManifest({ reportVersion: candidateVersion, commitSha: candidateSha, builtAt: new Date().toISOString() });
  if (eventName === "workflow_dispatch") return;
  const manifestUrl = new URL("deployment.json", baseUrl);
  const response = await fetcher(cacheBusted(manifestUrl), { cache: "no-store" });
  if (response.status === 404) return;
  const published = await fetchJson(response, "Production deployment manifest");
  const current = buildManifest(published);
  if (current.reportVersion === candidateVersion && current.commitSha !== candidateSha.toLowerCase()) {
    throw new Error(`Production already uses report version ${candidateVersion}; bump package.json before deploying a new commit.`);
  }
}

function requireCacheHeader(response, expected, label) {
  const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
  for (const token of expected) {
    if (!cacheControl.includes(token)) throw new Error(`${label} is missing Cache-Control ${token}. Received: ${cacheControl || "none"}`);
  }
}

export async function verifyProduction({ baseUrl, expectedVersion, expectedSha, fetcher = fetch }) {
  const normalizedSha = expectedSha.toLowerCase();
  buildManifest({ reportVersion: expectedVersion, commitSha: normalizedSha, builtAt: new Date().toISOString() });

  const manifestResponse = await fetcher(cacheBusted(new URL("deployment.json", baseUrl)), { cache: "no-store" });
  requireCacheHeader(manifestResponse, ["no-cache", "no-store", "must-revalidate"], "deployment.json");
  const manifest = buildManifest(await fetchJson(manifestResponse, "Production deployment manifest"));
  if (manifest.reportVersion !== expectedVersion || manifest.commitSha !== normalizedSha) {
    throw new Error(`Production identity mismatch: expected ${expectedVersion}/${normalizedSha}, received ${manifest.reportVersion}/${manifest.commitSha}.`);
  }

  const htmlResponse = await fetcher(cacheBusted(baseUrl), { cache: "no-store" });
  if (!htmlResponse.ok) throw new Error(`Production HTML returned HTTP ${htmlResponse.status}.`);
  requireCacheHeader(htmlResponse, ["no-cache", "no-store", "must-revalidate"], "Production HTML");
  const html = await htmlResponse.text();
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, "");
  const assets = extractStaticAssetPaths(html, basePath);
  if (assets.length === 0) throw new Error("Production HTML references no hashed JS/CSS assets.");

  let javascript = "";
  for (const asset of assets) {
    const assetResponse = await fetcher(cacheBusted(new URL(asset, baseUrl)), { cache: "no-store" });
    if (!assetResponse.ok) throw new Error(`Production asset ${asset} returned HTTP ${assetResponse.status}.`);
    requireCacheHeader(assetResponse, ["max-age=31536000", "immutable"], asset);
    if (asset.endsWith(".js")) javascript += await assetResponse.text();
  }
  const hasReportHeading = javascript.includes("personalizado") || javascript.includes("Personalized report");
  if (!javascript.includes(expectedVersion) || !hasReportHeading) {
    throw new Error("Published JavaScript does not contain the expected report heading and version.");
  }
  return { manifest, assets: assets.length };
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "write") {
    const [outputDirectory, commitSha, builtAt = new Date().toISOString()] = args;
    console.log(JSON.stringify(await writeManifest(outputDirectory, { reportVersion: REPORT_VERSION, commitSha, builtAt })));
    return;
  }
  if (mode === "verify-local") {
    const [outputDirectory, basePath] = args;
    console.log(JSON.stringify(await verifyStaticExport(outputDirectory, basePath)));
    return;
  }
  if (mode === "check-version") {
    const [baseUrl, eventName, candidateSha] = args;
    await checkProductionVersion({ baseUrl, candidateVersion: REPORT_VERSION, candidateSha, eventName });
    console.log(`Version ${REPORT_VERSION} is deployable.`);
    return;
  }
  if (mode === "verify-production") {
    const [baseUrl, expectedSha] = args;
    console.log(JSON.stringify(await verifyProduction({ baseUrl, expectedVersion: REPORT_VERSION, expectedSha })));
    return;
  }
  throw new Error("Usage: deploymentManifest.mjs <write|verify-local|check-version|verify-production> ...");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
