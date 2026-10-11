import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  // ─── Mise en place du module de test ───────────────────────────────────────
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: { user: { count: jest.fn().mockResolvedValue(0) } } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  // ─── Cas de test ───────────────────────────────────────────────────────────
  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should expose a public liveness response in English', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
