import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VerificationOrigineGuard } from './verification-origine.guard';

function contexteHttp(requete: Record<string, unknown>): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => requete }),
  } as unknown as ExecutionContext;
}

describe('VerificationOrigineGuard', () => {
  const garde = new VerificationOrigineGuard();
  const corsInitial = process.env.CORS_ORIGINS;
  const secureInitial = process.env.COOKIE_SECURE;

  beforeEach(() => {
    process.env.CORS_ORIGINS = 'https://viewer-rewards.example.com';
    process.env.COOKIE_SECURE = 'true';
  });

  afterAll(() => {
    process.env.CORS_ORIGINS = corsInitial;
    process.env.COOKIE_SECURE = secureInitial;
  });

  const cookieSession = { '__Host-vr_session': 'jeton' };

  it('laisse passer une requête mutante avec une origine autorisée', () => {
    const contexte = contexteHttp({
      method: 'POST',
      cookies: cookieSession,
      headers: { origin: 'https://viewer-rewards.example.com' },
    });

    expect(garde.canActivate(contexte)).toBe(true);
  });

  it("refuse une requête mutante venue d'un sous-domaine non déclaré", () => {
    const contexte = contexteHttp({
      method: 'POST',
      cookies: cookieSession,
      headers: { origin: 'https://promo.viewer-rewards.example.com' },
    });

    expect(() => garde.canActivate(contexte)).toThrow(ForbiddenException);
  });

  it('refuse une requête mutante sans en-tête Origin', () => {
    const contexte = contexteHttp({
      method: 'POST',
      cookies: cookieSession,
      headers: {},
    });

    expect(() => garde.canActivate(contexte)).toThrow(ForbiddenException);
  });

  it("refuse quand aucune origine autorisée n'est configurée", () => {
    process.env.CORS_ORIGINS = '';
    const contexte = contexteHttp({
      method: 'POST',
      cookies: cookieSession,
      headers: { origin: 'https://viewer-rewards.example.com' },
    });

    expect(() => garde.canActivate(contexte)).toThrow(ForbiddenException);
  });

  it('laisse passer une lecture, jamais mutante', () => {
    const contexte = contexteHttp({
      method: 'GET',
      cookies: cookieSession,
      headers: { origin: 'https://attaquant.example' },
    });

    expect(garde.canActivate(contexte)).toBe(true);
  });

  it('laisse passer un client porteur sans cookie de session', () => {
    const contexte = contexteHttp({
      method: 'POST',
      cookies: {},
      headers: { authorization: 'Bearer jeton' },
    });

    expect(garde.canActivate(contexte)).toBe(true);
  });

  it("n'exempte pas une requête au cookie sous prétexte d'un en-tête Authorization", () => {
    const contexte = contexteHttp({
      method: 'POST',
      cookies: cookieSession,
      headers: {
        authorization: 'Bearer bidon',
        origin: 'https://attaquant.example',
      },
    });

    expect(() => garde.canActivate(contexte)).toThrow(ForbiddenException);
  });

  it('ignore les contextes non HTTP (WebSocket)', () => {
    const contexte = {
      getType: () => 'ws',
    } as unknown as ExecutionContext;

    expect(garde.canActivate(contexte)).toBe(true);
  });
});
