import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// --- Mise en place du module de test ---
describe('AuthService', () => {
  let authService: AuthService;
  interface UtilisateurFake {
    id: string;
    email: string;
    passwordHash?: string;
  }

  let prisma: {
    user: {
      findUnique: jest.Mock<Promise<UtilisateurFake | null>, [unknown]>;
      create: jest.Mock<
        Promise<UtilisateurFake>,
        [{ data: { passwordHash: string } }]
      >;
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
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  // --- Cas de test : register ---
  it("refuse l'inscription si l'email est déjà utilisé", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'existe@example.com',
    });

    await expect(
      authService.register({
        email: 'existe@example.com',
        motDePasse: 'motdepasse123',
        pseudo: 'Existant',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('hache le mot de passe et crée le compte', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'nouveau@example.com',
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
    expect(resultat).toEqual({ accessToken: 'jeton-signe' });
  });

  // --- Cas de test : login ---
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
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'test@example.com',
        motDePasse: 'mauvaismotdepasse',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('retourne un jeton si les identifiants sont valides', async () => {
    const passwordHash = await bcrypt.hash('bonmotdepasse', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-4',
      email: 'test@example.com',
      passwordHash,
    });

    const resultat = await authService.login({
      email: 'test@example.com',
      motDePasse: 'bonmotdepasse',
    });

    expect(resultat).toEqual({ accessToken: 'jeton-signe' });
  });
});
