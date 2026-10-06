import { request as playwrightRequest } from '@playwright/test';

export default async function globalSetup() {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;
  if (!email || !password) return;

  const api = await playwrightRequest.newContext();
  const response = await api.post('http://localhost:3001/auth/login', {
    data: { email, motDePasse: password },
  });
  if (!response.ok()) throw new Error(`QA authentication HTTP status ${response.status()}`);
  await api.storageState({ path: `${process.cwd()}/test-results/qa-storage.json` });
  await api.dispose();
}
