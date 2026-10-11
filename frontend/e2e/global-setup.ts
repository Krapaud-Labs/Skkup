import { request as playwrightRequest } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export default async function globalSetup() {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;
  if (!email || !password) return;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const api = await playwrightRequest.newContext();
  const response = await api.post(`${apiBaseUrl.replace(/\/$/, '')}/auth/login`, {
    data: { email, motDePasse: password },
  });
  if (!response.ok()) throw new Error(`QA authentication HTTP status ${response.status()}`);
  const storagePath = path.resolve(process.cwd(), 'e2e/test-results/qa-storage.json');
  await mkdir(path.dirname(storagePath), { recursive: true });
  await api.storageState({ path: storagePath });
  await api.dispose();
}
