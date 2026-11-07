import { JwtService } from '@nestjs/jwt';
import { GATEWAY_OPTIONS } from '@nestjs/websockets/constants';
import type { IncomingMessage } from 'http';
import type { Server, Socket } from 'socket.io';
import { jourConnexion, nomCookieSession } from '../auth/cookie-session';
import {
  adresseClienteSocket,
  poigneeDeMainAutorisee,
  RealtimeGateway,
} from './realtime.gateway';
import {
  ROOM_PUBLIC,
  ROOM_TIRAGES,
  roomSession,
  roomUtilisateur,
} from './realtime.constants';
import { PrismaService } from '../prisma/prisma.service';
import { SessionRevocationService } from '../auth/session-revocation.service';

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
  emit: jest.Mock;
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
    emit: jest.fn(),
  };
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: JwtService;
  let emit: jest.Mock;
  let to: jest.Mock;
  let prisma: {
    user: { count: jest.Mock };
    authSession: { findUnique: jest.Mock; findMany: jest.Mock };
  };
  let revocation: SessionRevocationService;
  let sessions: Map<string, string>;
  let disconnectSockets: jest.Mock;
  let inRoom: jest.Mock;
  let numeroSession: number;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    jwtService = new JwtService({ secret: SECRET });
    sessions = new Map();
    numeroSession = 0;
    prisma = {
      user: { count: jest.fn().mockResolvedValue(0) },
      authSession: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { id: string } }) => {
            const userId = sessions.get(where.id);
            return Promise.resolve(
              userId
                ? {
                    userId,
                    sessionVersion: 0,
                    revokedAt: null,
                    expiresAt: new Date(Date.now() + 60_000),
                    user: { sessionVersion: 0, actif: true },
                  }
                : null,
            );
          }),
      },
    };
    revocation = new SessionRevocationService();
    gateway = new RealtimeGateway(
      jwtService,
      prisma as unknown as PrismaService,
      revocation,
    );

    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    disconnectSockets = jest.fn();
    inRoom = jest.fn(() => ({ disconnectSockets }));
    gateway.server = {
      to,
      in: inRoom,
    } as unknown as Server;
  });

  function creerJeton(userId = 'user-1') {
    const sid = `session-${++numeroSession}`;
    sessions.set(sid, userId);
    return {
      sessionId: sid,
      token: jwtService.sign({
        sub: userId,
        email: 'test@example.com',
        sid,
        sessionVersion: 0,
        jourConnexion: jourConnexion(),
      }),
    };
  }

  it('expose une configuration Socket.IO durcie pour le transport', () => {
    const options = Reflect.getMetadata(GATEWAY_OPTIONS, RealtimeGateway) as {
      maxHttpBufferSize?: number;
      connectTimeout?: number;
      allowEIO3?: boolean;
      allowRequest?: unknown;
    };

    expect(options.maxHttpBufferSize).toBe(8 * 1024);
    expect(options.connectTimeout).toBe(10_000);
    expect(options.allowEIO3).toBe(false);
    expect(typeof options.allowRequest).toBe('function');
  });

  function connecter(socket: SocketSimulee) {
    return gateway.handleConnection(socket as unknown as Socket);
  }

  it('déconnecte les sockets existantes lors de la révocation', async () => {
    const { token } = creerJeton();
    const socket = fausseSocket({ token });
    await connecter(socket);

    revocation.revoquer('user-1');

    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('déconnecte les sockets de la session A et garde celles de la session B', async () => {
    const sessionA = creerJeton();
    const sessionB = creerJeton();
    const socketA = fausseSocket({ token: sessionA.token });
    const socketB = fausseSocket({ token: sessionB.token });
    await connecter(socketA);
    await connecter(socketB);

    revocation.revoquerSession('user-1', sessionA.sessionId);

    expect(socketA.disconnect).toHaveBeenCalledWith(true);
    expect(socketB.disconnect).not.toHaveBeenCalled();
    expect(inRoom).toHaveBeenCalledWith(roomSession(sessionA.sessionId));
    expect(disconnectSockets).toHaveBeenCalledWith(true);
  });

  // ─── Authentification à la poignée de main ─────────────────────────────────
  it('accepte une connexion publique sans token et diffuse le compteur', async () => {
    const socket = fausseSocket();

    await connecter(socket);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith(ROOM_PUBLIC);
    expect(socket.emit).toHaveBeenCalledWith('users:count', { nombre: 0 });
  });

  it('refuse un token signé avec un autre secret', async () => {
    const { sessionId } = creerJeton();
    const token = new JwtService({ secret: 'autre-secret' }).sign({
      sub: 'user-1',
      email: 'test@example.com',
      sid: sessionId,
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
    const { token } = creerJeton();
    const socket = fausseSocket({ token });

    await connecter(socket);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
    expect(socket.join).toHaveBeenCalledWith(
      roomSession(socket.data.sessionId as string),
    );
    expect(socket.join).toHaveBeenCalledWith(ROOM_TIRAGES);
    expect(socket.data.userId).toBe('user-1');
  });

  it("lit le token dans l'en-tête Authorization à défaut du champ auth", async () => {
    const { token } = creerJeton();
    const socket = fausseSocket({}, { authorization: `Bearer ${token}` });

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
  });

  it('lit le token dans le cookie de session de la poignée de main', async () => {
    const { token } = creerJeton();
    const socket = fausseSocket(
      {},
      { cookie: `autre=valeur; ${nomCookieSession()}=${token}` },
    );

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
  });

  it('donne la priorité au cookie de session sur le champ auth', async () => {
    const tokenCookie = creerJeton('user-cookie').token;
    const tokenAuth = creerJeton('user-auth').token;
    const socket = fausseSocket(
      { token: tokenAuth },
      { cookie: `${nomCookieSession()}=${tokenCookie}` },
    );

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-cookie'));
  });

  it("ignore un en-tête Cookie malformé sans lever d'exception", async () => {
    const socket = fausseSocket({}, { cookie: `${nomCookieSession()}=%` });

    await expect(connecter(socket)).resolves.toBeUndefined();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith(ROOM_PUBLIC);
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

    function requete(
      headers: Record<string, string>,
      socket: { encrypted?: boolean } = {},
    ): IncomingMessage {
      return { headers, socket } as unknown as IncomingMessage;
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

    it('accepte une poignée de main same-origin par cookie sans en-tête Origin Chromium', () => {
      expect(
        poigneeDeMainAutorisee(
          requete({
            cookie: `${nomCookieSession()}=jeton`,
            host: 'skuup.example.com',
            'x-forwarded-proto': 'https',
          }),
        ),
      ).toBe(true);
    });

    it('refuse une poignée de main sans Origin avec un host non déclaré', () => {
      expect(
        poigneeDeMainAutorisee(
          requete({
            cookie: `${nomCookieSession()}=jeton`,
            host: 'inconnu.example.com',
            'x-forwarded-proto': 'https',
          }),
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
    const { token } = creerJeton();
    const socket = fausseSocket({ token, userId: 'user-victime' });

    await connecter(socket);

    expect(socket.join).toHaveBeenCalledWith(roomUtilisateur('user-1'));
    expect(socket.join).not.toHaveBeenCalledWith(
      roomUtilisateur('user-victime'),
    );
  });

  // ─── Plafond de connexions simultanées ─────────────────────────────────────
  it('refuse au-delà du plafond de connexions simultanées', async () => {
    const { token } = creerJeton();

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
    const { token } = creerJeton();

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
  it('émet une notification privée uniquement aux sessions actives', async () => {
    prisma.authSession.findMany.mockResolvedValue([
      {
        id: 'session-active',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        sessionVersion: 0,
        user: { sessionVersion: 0, actif: true },
      },
    ]);
    gateway.emettre('user:user-1', 'points:updated', { soldePoints: 42 });
    await new Promise((resolve) => setImmediate(resolve));

    expect(prisma.authSession.findMany).toHaveBeenCalled();
    expect(to).toHaveBeenCalledWith(roomSession('session-active'));
    expect(emit).toHaveBeenCalledWith('points:updated', { soldePoints: 42 });
  });

  it('n’envoie aucune notification privée aux sessions révoquées ou anciennes', async () => {
    prisma.authSession.findMany.mockResolvedValue([
      {
        id: 'session-revoquee',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        sessionVersion: 0,
        user: { sessionVersion: 0, actif: true },
      },
      {
        id: 'session-globale',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        sessionVersion: 0,
        user: { sessionVersion: 1, actif: true },
      },
      {
        id: 'session-inactive',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        sessionVersion: 1,
        user: { sessionVersion: 1, actif: false },
      },
    ]);
    gateway.emettre('user:user-1', 'points:updated', { soldePoints: 0 });
    await new Promise((resolve) => setImmediate(resolve));

    expect(to).not.toHaveBeenCalled();
  });

  it("n'échoue pas si le serveur n'est pas encore démarré", () => {
    gateway.server = undefined as unknown as Server;

    expect(() =>
      gateway.emettre('user:user-1', 'points:updated', { soldePoints: 42 }),
    ).not.toThrow();
  });
});
