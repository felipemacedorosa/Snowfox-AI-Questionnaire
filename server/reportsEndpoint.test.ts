import { existsSync } from "node:fs";
import { chmod, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildReportSnapshot } from "../app/reportSnapshot";

const endpointPath = path.join(process.cwd(), "public/api/reports.php");
const sheetHelperPath = path.join(process.cwd(), "public/api/_reportSheet.php");

it("ships the report persistence endpoint", () => {
  expect(existsSync(endpointPath)).toBe(true);
  expect(existsSync(sheetHelperPath)).toBe(true);
});

const describePhp = process.env.RUN_PHP_INTEGRATION === "1" ? describe : describe.skip;

describePhp("reports.php", () => {
  let php: ChildProcess;
  let reportDir: string;
  let origin: string;

  const snapshot = buildReportSnapshot({
    answers: { dados_q1: 2, est_q1: 3, est_q1b: 2, tec_q1: 1, tec_q1b: 2 },
    participant: { name: "Teste Endpoint", email: "endpoint@snowfox.ai", storageAcknowledged: true },
    submissionId: "4b4d9728-6f1d-4f9d-b3fc-ff824d856e25",
    clientSubmittedAt: "2026-08-04T20:00:00.000Z",
  });

  const freePort = () => new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not allocate a test port"));
      server.close(error => error ? reject(error) : resolve(address.port));
    });
  });

  const post = (body: unknown, requestOrigin = origin, referer?: string) => fetch(`${origin}/api/reports.php`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: requestOrigin, ...(referer ? { referer } : {}) },
    body: JSON.stringify(body),
  });

  beforeAll(async () => {
    reportDir = await mkdtemp(path.join(tmpdir(), "snowfox-ai-reports-"));
    const port = await freePort();
    origin = `http://127.0.0.1:${port}`;
    php = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", "public"], {
      cwd: process.cwd(),
      env: { ...process.env, SNOWFOX_AI_REPORT_DIR: reportDir },
      stdio: "pipe",
    });

    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        if ((await fetch(`${origin}/api/reports.php`)).status === 405) return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    throw new Error("PHP test server did not start");
  });

  beforeEach(async () => {
    for (const file of await readdir(reportDir)) await unlink(path.join(reportDir, file));
  });

  afterAll(async () => {
    php?.kill("SIGTERM");
    await rm(reportDir, { recursive: true, force: true });
  });

  it("writes one validated report outside the web root", async () => {
    const response = await post(snapshot);
    expect(response.status).toBe(201);
    const receipt = await response.json() as Record<string, string>;
    expect(receipt).toMatchObject({ submissionId: snapshot.submissionId });

    const files = await readdir(reportDir);
    expect(files.filter(file => file.endsWith(".json"))).toEqual([`${snapshot.submissionId}.json`]);
    const saved = JSON.parse(await readFile(path.join(reportDir, `${snapshot.submissionId}.json`), "utf8"));
    expect(saved).toMatchObject({ ...snapshot, receivedAt: receipt.receivedAt, payloadHash: receipt.payloadHash });
    expect(saved).not.toHaveProperty("ip");
  });

  it("returns the original receipt for an identical retry", async () => {
    const first = await post(snapshot);
    const firstReceipt = await first.json();
    const second = await post(snapshot);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(firstReceipt);
    expect((await readdir(reportDir)).filter(file => file.endsWith(".json"))).toHaveLength(1);
  });

  it("keeps the saved report available when a configured Sheet sync fails", async () => {
    const first = await post(snapshot);
    expect(first.status).toBe(201);
    await writeFile(path.join(reportDir, ".google-service-account"), "{}", { mode: 0o400 });

    const retry = await post(snapshot);
    expect(retry.status).toBe(503);
    await expect(retry.json()).resolves.toMatchObject({ code: "sheet_sync_unavailable" });
    expect((await readdir(reportDir)).filter(file => file.endsWith(".json"))).toEqual([`${snapshot.submissionId}.json`]);
  });

  it("stores supported UTM attribution without unrelated query parameters", async () => {
    const sourced = { ...snapshot, submissionId: "94e73f7a-6a5c-44a5-bad7-0aa6ed10e315" };
    const sourceUrl = `${origin}/?utm_source=linkedin&utm_medium=social&utm_campaign=readiness&utm_content=post-assess-033&utm_term=governanca&private=discard`;
    const response = await post(sourced, origin, sourceUrl);
    expect(response.status).toBe(201);

    const saved = JSON.parse(await readFile(path.join(reportDir, `${sourced.submissionId}.json`), "utf8"));
    expect(saved.source).toEqual({
      url: `${origin}/?utm_source=linkedin&utm_medium=social&utm_campaign=readiness&utm_content=post-assess-033&utm_term=governanca`,
      utmSource: "linkedin",
      utmMedium: "social",
      utmCampaign: "readiness",
      utmContent: "post-assess-033",
      utmTerm: "governanca",
    });
  });

  it("rejects changed content that reuses a submission id", async () => {
    await post(snapshot);
    const response = await post({ ...snapshot, participant: { ...snapshot.participant, name: "Outro Nome" } });
    expect(response.status).toBe(409);
  });

  it.each([
    ["wrong method", () => fetch(`${origin}/api/reports.php`, { method: "GET" }), 405],
    ["wrong origin", () => post(snapshot, "https://example.com"), 403],
    ["wrong content type", () => fetch(`${origin}/api/reports.php`, { method: "POST", headers: { "content-type": "text/plain", origin }, body: JSON.stringify(snapshot) }), 415],
    ["invalid name", () => post({ ...snapshot, participant: { ...snapshot.participant, name: "X" } }), 400],
    ["invalid email", () => post({ ...snapshot, participant: { ...snapshot.participant, email: "not-an-email" } }), 400],
    ["missing acknowledgement", () => post({ ...snapshot, participant: { ...snapshot.participant, storageAcknowledged: false } }), 400],
    ["invalid uuid", () => post({ ...snapshot, submissionId: "bad-id" }), 400],
    ["invalid report shape", () => post({ ...snapshot, report: { overallScore: 50 } }), 400],
    ["extra top-level field", () => post({ ...snapshot, extra: true }), 400],
  ] as const)("rejects %s", async (_label, request, expectedStatus) => {
    expect((await request()).status).toBe(expectedStatus);
  });

  it("rejects requests over 256 KiB", async () => {
    const response = await post({ ...snapshot, oversized: "x".repeat(257 * 1024) });
    expect(response.status).toBe(413);
  });

  it("returns a generic error when storage is unavailable", async () => {
    await chmod(reportDir, 0o500);
    try {
      const response = await post({ ...snapshot, submissionId: "6158fe1c-2fea-4d8d-9f16-443846c0c479" });
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({ code: "storage_unavailable" });
    } finally {
      await chmod(reportDir, 0o700);
    }
  });
});
