import { JwtService } from '@nestjs/jwt';
import type { IncomingMessage } from 'http';
import type { Server, Socket } from 'socket.io';
import { nomCookieSession } from '../auth/cookie-session';
import {
  adresseClienteSocket,
  poigneeDeMainAutorisee,
  RealtimeGateway,
} from './realtime.gateway';
import { ROOM_TIRAGES, roomUtilisateur } from './realtime.constants';

const SECRET = 'secret-de-test';

interface SocketSimulee {
  id: string;
  data: Record<string, unknown>;
  handshake: {
    auth: Record<string, unknown>;
    headers: Record<string, string>;
    address: string;
  };
  join: jest.Mock;
  disconnect: jest.Mock;
}

let compteurSockets = 0;

function fausseSocket(
  auth: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): SocketSimulee {
  compteurSockets += 1;
  return {
    id: `socket-${compteurSockets}`,
    data: {},
    handshake: { auth, headers, address: '127.0.0.1' },
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  };
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: JwtService;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    jwtService = new JwtService({ secret: SECRET });
    gateway = new RealtimeGateway(jwtService);

    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    gateway.server = { to } as unknown as Server;
  });

  function connecter(socket: SocketSimulee) {
    return gateway.handleConnection(socket as unknown as Socket);
  }

  // ─── Authentification à la poignée de main ─────────────────────────────────
  it('refuse une connexion sans token', async () => {
    const socket = fausseSocket();

    await connecter(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('refuse un token signé avec un autre secret', async () => {
    const token = new JwtService({ secret: 'autre-secret' }).sign({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const socket = fausseSocket({ token });

    await connecter(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('refuse un token expiré', async () => {
    const token = jwtService.sign(
      { sub: 'user-1', email: 'test@example.com' },
      { expiresIn: '-1s' },
    );
    const socket = fausseSocket({ token });

    await connecter(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('refuse un token sans identifiant utilisateur', async () => {
    const token = jwtService.sign({ email: 'test@example.com' });
    const socket = fausseSocket({ token });

    await connecter(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('accepte un token valide et rejoint les rooms attendues', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const socket = fausseSocket({ token });

    await connecter(socket);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
    expect(socket.join).toHaveBeenCalledWith(ROOM_TIRAGES);
    expect(socket.data.userId).toBe('user-1');
  });

  it("lit le token dans l'en-tête Authorization à défaut du champ auth", async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const socket = fausseSocket({}, { authorization: `Bearer ${token}` });

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
  });

  it('lit le token dans le cookie de session de la poignée de main', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const socket = fausseSocket(
      {},
      { cookie: `autre=valeur; ${nomCookieSession()}=${token}` },
    );

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
  });

  it('donne la priorité au cookie de session sur le champ auth', async () => {
    const tokenCookie = jwtService.sign({
      sub: 'user-cookie',
      email: 'test@example.com',
    });
    const tokenAuth = jwtService.sign({
      sub: 'user-auth',
      email: 'test@example.com',
    });
    const socket = fausseSocket(
      { token: tokenAuth },
      { cookie: `${nomCookieSession()}=${tokenCookie}` },
    );

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-cookie'));
  });

  it("refuse un en-tête Cookie malformé sans lever d'exception", async () => {
    const socket = fausseSocket({}, { cookie: `${nomCookieSession()}=%` });

    await expect(connecter(socket)).resolves.toBeUndefined();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  // ─── Vérification d'origine de la poignée de main ──────────────────────────
  describe('poigneeDeMainAutorisee', () => {
    const corsInitial = process.env.CORS_ORIGINS;

    beforeEach(() => {
      process.env.CORS_ORIGINS = 'https://skuup.example.com';
    });

    afterAll(() => {
      process.env.CORS_ORIGINS = corsInitial;
    });

    function requete(headers: Record<string, string>): IncomingMessage {
      return { headers } as unknown as IncomingMessage;
    }

    it('accepte une poignée de main par cookie depuis une origine déclarée', () => {
      expect(
        poigneeDeMainAutorisee(
          requete({
            cookie: `${nomCookieSession()}=jeton`,
            origin: 'https://skuup.example.com',
          }),
        ),
      ).toBe(true);
    });

    it("refuse une poignée de main par cookie venue d'un sous-domaine non déclaré", () => {
      expect(
        poigneeDeMainAutorisee(
          requete({
            cookie: `${nomCookieSession()}=jeton`,
            origin: 'https://promo.skuup.example.com',
          }),
        ),
      ).toBe(false);
    });

    it('refuse une poignée de main par cookie sans en-tête Origin', () => {
      expect(
        poigneeDeMainAutorisee(
          requete({ cookie: `${nomCookieSession()}=jeton` }),
        ),
      ).toBe(false);
    });

    it('refuse une poignée de main par cookie quand aucune origine n’est déclarée', () => {
      process.env.CORS_ORIGINS = '';

      expect(
        poigneeDeMainAutorisee(
          requete({
            cookie: `${nomCookieSession()}=jeton`,
            origin: 'https://skuup.example.com',
          }),
        ),
      ).toBe(false);
    });

    it('laisse passer un client porteur sans cookie, quelle que soit son origine', () => {
      expect(
        poigneeDeMainAutorisee(
          requete({
            authorization: 'Bearer jeton',
            origin: 'chrome-extension://abcdef',
          }),
        ),
      ).toBe(true);
    });
  });

  // ─── Cloisonnement des rooms ───────────────────────────────────────────────
  it("ignore un userId fourni par le client et n'utilise que celui du JWT", async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });
    const socket = fausseSocket({ token, userId: 'user-victime' });

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
    expect(socket.join).not.toHaveBeenCalledWith(
      roomUtilisateur('user-victime'),
    );
  });

  // ─── Plafond de connexions simultanées ─────────────────────────────────────
  it('refuse au-delà du plafond de connexions simultanées', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });

    for (let i = 0; i < 10; i += 1) {
      const acceptee = fausseSocket({ token });
      await connecter(acceptee);
      expect(acceptee.disconnect).not.toHaveBeenCalled();
    }

    const refusee = fausseSocket({ token });
    await connecter(refusee);

    expect(refusee.disconnect).toHaveBeenCalledWith(true);
    expect(refusee.join).not.toHaveBeenCalled();
  });

  it('limite les tentatives avant la vérification JWT pour une même IP', async () => {
    const verification = jest.spyOn(jwtService, 'verifyAsync');
    const sockets = Array.from({ length: 31 }, () =>
      fausseSocket({ token: 'jeton-invalide' }),
    );

    for (const socket of sockets) {
      await connecter(socket);
    }

    expect(verification).toHaveBeenCalledTimes(30);
    expect(sockets[30].disconnect).toHaveBeenCalledWith(true);
    expect(sockets[30].join).not.toHaveBeenCalled();
  });

  it("dérive l'adresse WebSocket selon le nombre de proxys de confiance", () => {
    const valeurInitiale = process.env.TRUSTED_PROXY_HOPS;
    process.env.TRUSTED_PROXY_HOPS = '1';
    const socket = fausseSocket(
      {},
      { 'x-forwarded-for': '198.51.100.9, 10.0.0.8' },
    );
    socket.handshake.address = '10.0.0.2';

    try {
      expect(adresseClienteSocket(socket as unknown as Socket)).toBe(
        '10.0.0.8',
      );
    } finally {
      if (valeurInitiale === undefined) {
        delete process.env.TRUSTED_PROXY_HOPS;
      } else {
        process.env.TRUSTED_PROXY_HOPS = valeurInitiale;
      }
    }
  });

  it('libère le quota à la déconnexion', async () => {
    const token = jwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
    });

    const sockets: SocketSimulee[] = [];
    for (let i = 0; i < 10; i += 1) {
      const socket = fausseSocket({ token });
      await connecter(socket);
      sockets.push(socket);
    }
    gateway.handleDisconnect(sockets[0] as unknown as Socket);

    const nouvelle = fausseSocket({ token });
    await connecter(nouvelle);

    expect(nouvelle.disconnect).not.toHaveBeenCalled();
    expect(nouvelle.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
  });

  // ─── Diffusion ─────────────────────────────────────────────────────────────
  it('émet vers la room demandée', () => {
    gateway.emettre('user:user-1', 'points:updated', { soldePoints: 42 });

    expect(to).toHaveBeenCalledWith('user:user-1');
    expect(emit).toHaveBeenCalledWith('points:updated', { soldePoints: 42 });
  });

  it("n'échoue pas si le serveur n'est pas encore démarré", () => {
    gateway.server = undefined as unknown as Server;

    expect(() =>
      gateway.emettre('user:user-1', 'points:updated', { soldePoints: 42 }),
    ).not.toThrow();
  });
});
