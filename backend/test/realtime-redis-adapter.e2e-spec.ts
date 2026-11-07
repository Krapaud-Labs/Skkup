import { createServer, type Server as HttpServer } from 'node:http';
import { once } from 'node:events';
import IORedis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  io as createClient,
  type Socket as ClientSocket,
} from 'socket.io-client';
import { Server as SocketServer, type Socket as ServerSocket } from 'socket.io';

const redisUrl = process.env.REDIS_URL;
const describeAvecRedis = redisUrl ? describe : describe.skip;

describeAvecRedis('Socket.IO Redis adapter session revocation', () => {
  const sidA = 'session-device-a';
  const sidB = 'session-device-b';
  let httpServerA: HttpServer;
  let httpServerB: HttpServer;
  let ioA: SocketServer;
  let ioB: SocketServer;
  let publisherA: IORedis;
  let subscriberA: IORedis;
  let publisherB: IORedis;
  let subscriberB: IORedis;
  let clientA: ClientSocket;
  let clientB: ClientSocket;

  async function demarrerHttp(server: HttpServer): Promise<number> {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('The test HTTP server did not bind a TCP port.');
    }
    return address.port;
  }

  async function connecter(client: ClientSocket): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      client.once('connect', resolve);
      client.once('connect_error', reject);
      client.connect();
    });
  }

  async function fermerServeur(server?: SocketServer): Promise<void> {
    if (!server) return;
    await server.close();
  }

  beforeAll(async () => {
    if (!redisUrl) return;
    publisherA = new IORedis(redisUrl, { maxRetriesPerRequest: 1 });
    subscriberA = publisherA.duplicate();
    publisherB = new IORedis(redisUrl, { maxRetriesPerRequest: 1 });
    subscriberB = publisherB.duplicate();
    await Promise.all([
      publisherA.ping(),
      subscriberA.ping(),
      publisherB.ping(),
      subscriberB.ping(),
    ]);

    httpServerA = createServer();
    httpServerB = createServer();
    ioA = new SocketServer(httpServerA, {
      adapter: createAdapter(publisherA, subscriberA),
    });
    ioB = new SocketServer(httpServerB, {
      adapter: createAdapter(publisherB, subscriberB),
    });
    ioB.use((socket: ServerSocket, next: (err?: Error) => void) => {
      const auth = socket.handshake.auth as Record<string, unknown>;
      const sid = auth.sid;
      if (typeof sid !== 'string' || (sid !== sidA && sid !== sidB)) {
        next(new Error('invalid session'));
        return;
      }
      const resultatRejointure = socket.join(`session:${sid}`);
      if (resultatRejointure instanceof Promise) {
        void resultatRejointure.catch(() => socket.disconnect(true));
      }
      next();
    });

    const [portA, portB] = await Promise.all([
      demarrerHttp(httpServerA),
      demarrerHttp(httpServerB),
    ]);
    expect(portA).toBeGreaterThan(0);
    clientA = createClient(`http://127.0.0.1:${portB}`, {
      auth: { sid: sidA },
      transports: ['websocket'],
      reconnection: false,
      timeout: 5_000,
    });
    clientB = createClient(`http://127.0.0.1:${portB}`, {
      auth: { sid: sidB },
      transports: ['websocket'],
      reconnection: false,
      timeout: 5_000,
    });
    await Promise.all([connecter(clientA), connecter(clientB)]);
  }, 15_000);

  afterAll(async () => {
    clientA?.disconnect();
    clientB?.disconnect();
    await fermerServeur(ioA);
    await fermerServeur(ioB);
    await Promise.allSettled([
      publisherA?.quit(),
      subscriberA?.quit(),
      publisherB?.quit(),
      subscriberB?.quit(),
    ]);
  });

  it('disconnects only device A across API servers while device B stays connected', async () => {
    const socketADeconnectee = new Promise<string>((resolve) => {
      clientA.once('disconnect', resolve);
    });
    ioA.in(`session:${sidA}`).disconnectSockets(true);

    const motif = await socketADeconnectee;
    expect(motif).toBe('io server disconnect');
    expect(clientA.connected).toBe(false);
    expect(clientB.connected).toBe(true);
    expect(ioB.of('/').adapter.rooms.has(`session:${sidA}`)).toBe(false);
    expect(ioB.of('/').adapter.rooms.has(`session:${sidB}`)).toBe(true);
  }, 10_000);
});
