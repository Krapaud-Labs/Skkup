import { request as playwrightRequest } from '@playwright/test';

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
  await api.storageState({ path: `${process.cwd()}/test-results/qa-storage.json` });
  await api.dispose();
}
