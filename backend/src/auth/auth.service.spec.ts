import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionRevocationService } from './session-revocation.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Prisma } from '../../generated/prisma/client';

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('AuthService', () => {
  let authService: AuthService;
  interface UtilisateurFake {
    id: string;
    email: string;
    pseudo: string;
    passwordHash?: string;
  }

  let prisma: {
    user: {
      findUnique: jest.Mock<Promise<UtilisateurFake | null>, [unknown]>;
      create: jest.Mock<
        Promise<UtilisateurFake>,
        [{ data: { passwordHash: string } }]
      >;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn<Promise<UtilisateurFake | null>, [unknown]>(),
        create: jest.fn<
          Promise<UtilisateurFake>,
          [{ data: { passwordHash: string } }]
        >(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jeton-signe') },
        },
        {
          provide: SessionRevocationService,
          useValue: { revoquer: jest.fn() },
        },
        {
          provide: RealtimeService,
          useValue: { notifierNombreUtilisateurs: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  // ─── Cas de test : register ────────────────────────────────────────────────
  it("renvoie un message générique en cas de conflit d'unicité", async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      authService.register({
        email: 'existe@example.com',
        motDePasse: 'motdepasse123',
        pseudo: 'Existant',
      }),
    ).rejects.toThrow(
      new ConflictException('Inscription impossible avec ces informations.'),
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('masque une erreur interne de base de données', async () => {
    const erreur = new Error('Base indisponible');
    prisma.user.create.mockRejectedValue(erreur);

    await expect(
      authService.register({
        email: 'nouveau@example.com',
        motDePasse: 'motdepasse123',
        pseudo: 'Nouveau',
      }),
    ).rejects.toThrow('Internal server error.');
  });

  it('hache le mot de passe et crée le compte', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'nouveau@example.com',
      pseudo: 'Nouveau',
    });

    const resultat = await authService.register({
      email: 'nouveau@example.com',
      motDePasse: 'motdepasse123',
      pseudo: 'Nouveau',
    });

    const donneesCreation = prisma.user.create.mock.calls[0][0].data;
    expect(donneesCreation.passwordHash).not.toBe('motdepasse123');
    expect(
      await bcrypt.compare('motdepasse123', donneesCreation.passwordHash),
    ).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(resultat).toEqual({ accessToken: 'jeton-signe', pseudo: 'Nouveau' });
  });

  // ─── Cas de test : login ───────────────────────────────────────────────────
  it("refuse la connexion si l'utilisateur n'existe pas", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'inconnu@example.com',
        motDePasse: 'peu importe',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse la connexion si le mot de passe est incorrect', async () => {
    const passwordHash = await bcrypt.hash('bonmotdepasse', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-3',
      email: 'test@example.com',
      pseudo: 'Testeur',
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'test@example.com',
        motDePasse: 'mauvaismotdepasse',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('retourne le jeton et le pseudo si les identifiants sont valides', async () => {
    const passwordHash = await bcrypt.hash('bonmotdepasse', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-4',
      email: 'test@example.com',
      pseudo: 'Testeur',
      passwordHash,
    });

    const resultat = await authService.login({
      email: 'test@example.com',
      motDePasse: 'bonmotdepasse',
    });

    expect(resultat).toEqual({ accessToken: 'jeton-signe', pseudo: 'Testeur' });
  });

  it('révoque les JWT et notifie les sockets lors de la déconnexion', async () => {
    const revoquer = jest.fn();
    const service = new AuthService(
      prisma as unknown as PrismaService,
      { sign: jest.fn() } as unknown as JwtService,
      { revoquer } as unknown as SessionRevocationService,
    );

    await service.deconnecter('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(revoquer).toHaveBeenCalledWith('user-1');
  });
});
