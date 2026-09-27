import express from 'express';
import request from 'supertest';
import { enTetesSecurite } from './security-headers';

describe('enTetesSecurite', () => {
  const environnementInitial = process.env.NODE_ENV;

  afterEach(() => {
    if (environnementInitial === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environnementInitial;
  });

  it('applique les en-têtes de défense en profondeur', async () => {
    const app = express();
    app.use(enTetesSecurite);
    app.get('/health', (_request, response) => response.send('ok'));

    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy']).toContain('camera=()');
    expect(response.headers['cross-origin-resource-policy']).toBe('same-site');
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
  });

  it('ajoute HSTS uniquement en production', async () => {
    process.env.NODE_ENV = 'production';
    const app = express();
    app.use(enTetesSecurite);
    app.get('/health', (_request, response) => response.send('ok'));

    const response = await request(app).get('/health').expect(200);

    expect(response.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });
});
