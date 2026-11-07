import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Adaptateur Socket.IO partagé entre les processus API. Les opérations de
 * room (dont disconnectSockets) sont propagées via Redis Pub/Sub.
 */
export class RedisSocketIoAdapter extends IoAdapter {
  private readonly publisher: IORedis;
  private readonly subscriber: IORedis;

  constructor(app: INestApplication, redisUrl: string) {
    super(app);
    this.publisher = new IORedis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    this.subscriber = this.publisher.duplicate({
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  async connect(): Promise<void> {
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(createAdapter(this.publisher, this.subscriber));
    return server;
  }

  async close(server: Server): Promise<void> {
    await super.close(server);
    await this.destroy();
  }

  async destroy(): Promise<void> {
    await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
  }
}
