import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Point d'entrée de l'API : démarre l'application NestJS sur le port
// défini par la variable d'environnement PORT (3000 par défaut).
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
