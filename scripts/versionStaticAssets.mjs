import { readFileSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const SEMVER = /^\d+\.\d+\.\d+$/;
const STATIC_ASSET = /((?:https?:\/\/[^"'\\\s?]+)?\/[^"'\\\s?]*_next\/static\/[^"'\\\s?]+\.(?:js|css))(\?[^"'\\\s]*)?/gi;

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath));
    else if (entry.isFile() && (entry.name.endsWith(".html") || entry.name.endsWith(".txt"))) files.push(fullPath);
  }
  return files;
}

export async function versionStaticAssetUrls(outputDirectory, version) {
  if (!SEMVER.test(version)) throw new Error("Static asset version must be semantic x.y.z.");
  let filesChanged = 0;
  let referencesVersioned = 0;

  for (const file of await filesUnder(outputDirectory)) {
    const source = await readFile(file, "utf8");
    const versioned = source.replace(STATIC_ASSET, (reference, asset, query = "") => {
      const params = new URLSearchParams(query.slice(1));
      if (params.get("v") === version) return reference;
      params.set("v", version);
      referencesVersioned += 1;
      return `${asset}?${params.toString()}`;
    });
    if (versioned !== source) {
      await writeFile(file, versioned, "utf8");
      filesChanged += 1;
    }
  }

  return { filesChanged, referencesVersioned };
}

async function main() {
  const [outputDirectory, version = packageJson.version] = process.argv.slice(2);
  if (!outputDirectory) throw new Error("Usage: versionStaticAssets.mjs <output-directory> [version]");
  console.log(JSON.stringify(await versionStaticAssetUrls(outputDirectory, version)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
