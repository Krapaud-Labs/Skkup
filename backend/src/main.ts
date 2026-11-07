import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { originesAutorisees } from './common/cors';
import { sautsDeProxyDeConfiance } from './common/proxy-de-confiance';
import { enTetesSecurite } from './common/security-headers';
import { requireRedisUrl } from './common/redis-config';
import { RedisSocketIoAdapter } from './realtime/redis-socket.adapter';

// Point d'entrée de l'API : démarre l'application NestJS sur le port
// défini par la variable d'environnement PORT (3000 par défaut).
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const socketAdapter = new RedisSocketIoAdapter(
    app,
    requireRedisUrl(process.env.REDIS_URL),
  );
  try {
    await socketAdapter.connect();
  } catch (error) {
    await socketAdapter.destroy();
    throw error;
  }
  app.useWebSocketAdapter(socketAdapter);
  app.disable('x-powered-by');

  // Nécessaire pour lire le cookie de session (stratégie JWT et
  // vérification d'origine). Aucun secret de signature n'est passé : le
  // cookie porte un JWT déjà signé, pas besoin d'une seconde signature.
  app.use(cookieParser());
  app.use(enTetesSecurite);

  // Derrière Traefik, l'adresse de la socket est celle du proxy : sans ce
  // réglage toutes les requêtes partagent une seule et même IP, et la
  // limitation de débit par IP (notamment `POST /extension/pair`, non
  // authentifiée) devient un compteur global qu'un seul client épuise
  // pour tout le monde. Voir docs/05-security.md, section Adresse
  // cliente derrière le reverse proxy.
  app.set('trust proxy', sautsDeProxyDeConfiance());

  // `credentials` est indispensable pour que le navigateur joigne le
  // cookie de session aux appels du frontend. La liste d'origines est
  // toujours explicite : jamais de renvoi en miroir de l'`Origin` reçue,
  // qui autoriserait n'importe quel site à lire des réponses
  // authentifiées.
  app.enableCors({
    origin: originesAutorisees(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
