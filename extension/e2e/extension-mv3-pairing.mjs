import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const apiUrl = process.env.SKKUP_API_URL;
const extensionPath = process.env.SKKUP_EXTENSION_PATH;
const playwrightModulePath = process.env.PLAYWRIGHT_MODULE_PATH;
if (process.env.SKKUP_E2E_DOCKER !== "1") {
  throw new Error("Run this test only through the isolated Docker E2E runner.");
}
for (const [name, value] of Object.entries({
  SKKUP_API_URL: apiUrl,
  SKKUP_EXTENSION_PATH: extensionPath,
  PLAYWRIGHT_MODULE_PATH: playwrightModulePath,
})) {
  if (!value) throw new Error(`${name} is required.`);
}
const api = new URL(apiUrl);
if (api.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(api.hostname)) {
  throw new Error("The MV3 E2E runner must target the isolated backend through loopback HTTP.");
}

const { chromium, request } = await import(pathToFileURL(playwrightModulePath).href);

const userDataDir = await mkdtemp(path.join(os.tmpdir(), "skkup-extension-mv3-"));
let context;
let apiContext;
let credentialApiContext;

try {
  apiContext = await request.newContext({
    baseURL: api.origin,
    extraHTTPHeaders: { Origin: api.origin },
  });
  credentialApiContext = await request.newContext({ baseURL: api.origin });
  const nonce = `${Date.now()}-${process.pid}`;
  const pseudo = `MV3-${nonce}`;
  const inscription = await apiContext.post("/auth/register", {
    data: {
      email: `extension-mv3-${nonce}@example.test`,
      motDePasse: "Skkup-E2E-Valid-2026!",
      pseudo,
      accepteReglement: true,
    },
  });
  assert.equal(inscription.status(), 201, "the isolated synthetic viewer account registers");

  const generation = await apiContext.post("/extension/pairing-token");
  assert.equal(generation.status(), 201, "the viewer session can generate a one-use pairing code");
  const { code } = await generation.json();
  assert.ok(/^[A-Z0-9-]{12,14}$/i.test(code), "the API returns a pairing code for the real popup");

  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: process.env.CHROME_BIN || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;
  assert.ok(extensionId, "Chromium started the MV3 service worker from the built extension");
  if (process.env.SKKUP_EXTENSION_TEST_ID) {
    assert.equal(extensionId, process.env.SKKUP_EXTENSION_TEST_ID, "Chromium loaded the isolated test extension identity");
  }

  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const popup = await context.newPage();
  await popup.goto(popupUrl);
  await popup.locator("#champ-code").waitFor({ state: "visible" });
  await popup.locator("#champ-code").fill(code);
  await popup.locator("#bouton-associer").click();
  await popup.locator("#section-suivi").waitFor({ state: "visible" });
  assert.equal(await popup.locator("#pseudo").textContent(), pseudo);

  const persisted = await popup.evaluate(async () =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get("appariement", (values) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(values.appariement);
      });
    }),
  );
  assert.equal(persisted.pseudo, pseudo, "the real popup stored the associated viewer");
  assert.ok(/^vrx_[A-Za-z0-9_-]+$/.test(persisted.jeton), "chrome.storage.local contains the opaque extension credential");
  assert.ok(Date.parse(persisted.expireAt) > Date.now(), "the stored credential is not expired");

  await popup.reload();
  await popup.locator("#section-suivi").waitFor({ state: "visible" });
  assert.equal(await popup.locator("#pseudo").textContent(), pseudo, "the popup reads the association after reload");
  const afterReload = await popup.evaluate(async () =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get("appariement", (values) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(values.appariement);
      });
    }),
  );
  assert.equal(afterReload.pseudo, persisted.pseudo, "the associated viewer survives an actual popup reload");
  assert.equal(afterReload.expireAt, persisted.expireAt, "the credential expiry survives an actual popup reload");
  assert.ok(afterReload.jeton === persisted.jeton, "the credential itself survives an actual popup reload");

  const session = await credentialApiContext.post("/watch-sessions", {
    headers: { Authorization: `Bearer ${persisted.jeton}` },
    data: { platform: "TWITCH", streamExternalId: `mv3-${nonce}` },
  });
  assert.equal(session.status(), 201, "the credential read from Chrome storage authorizes the protected watch API");
  const { id: sessionId } = await session.json();
  const closeSession = await credentialApiContext.post(`/watch-sessions/${encodeURIComponent(sessionId)}/close`, {
    headers: { Authorization: `Bearer ${persisted.jeton}` },
  });
  assert.equal(closeSession.status(), 201, "the synthetic watch session is closed before revocation");

  const pairingsResponse = await apiContext.get("/extension/pairings");
  assert.equal(pairingsResponse.status(), 200);
  const { appareils } = await pairingsResponse.json();
  const pairing = appareils.find((device) => device.statut === "ACTIF");
  assert.ok(pairing, "the viewer API lists the active browser pairing");
  const revocation = await apiContext.delete(`/extension/pairings/${encodeURIComponent(pairing.id)}`);
  assert.equal(revocation.status(), 204, "the viewer API revokes this browser pairing");
  const denied = await credentialApiContext.post("/watch-sessions", {
    headers: { Authorization: `Bearer ${persisted.jeton}` },
    data: { platform: "TWITCH", streamExternalId: `mv3-revoked-${nonce}` },
  });
  assert.equal(denied.status(), 401, "the protected watch API rejects the revoked browser credential");

  const replay = await credentialApiContext.post("/extension/pair", {
    data: { code },
  });
  assert.equal(replay.status(), 401, "the backend rejects reuse of the consumed pairing code");

  await popup.locator("#bouton-dissocier").click();
  await popup.locator("#section-appariement").waitFor({ state: "visible" });
  const afterUnpair = await popup.evaluate(async () =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get("appariement", (values) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(values.appariement);
      });
    }),
  );
  assert.equal(afterUnpair, undefined, "local unpair removes the credential key from chrome.storage.local");

  console.log("PASS: real MV3 popup pairing, chrome.storage.local persistence after reload, one-use code, protected API use, server-side revocation, and local unpair.");
} finally {
  await context?.close();
  await apiContext?.dispose();
  await credentialApiContext?.dispose();
  await rm(userDataDir, { recursive: true, force: true });
}
