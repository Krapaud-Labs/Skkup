import { RealtimeService } from './realtime.service';
import type { RealtimeGateway } from './realtime.gateway';
import {
  EVENEMENT_CARTE_DEBLOQUEE,
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_STREAK_MIS_A_JOUR,
  EVENEMENT_TIRAGE_RESULTAT,
  EVENEMENT_TIRAGE_STATUT,
  EVENEMENT_APPARIEMENTS_MIS_A_JOUR,
  ROOM_TIRAGES,
} from './realtime.constants';

describe('RealtimeService', () => {
  let emettre: jest.Mock;
  let service: RealtimeService;

  beforeEach(() => {
    emettre = jest.fn();
    service = new RealtimeService({
      emettre,
    } as unknown as RealtimeGateway);
  });

  // ─── Notifications privées ─────────────────────────────────────────────────
  it('envoie le solde de points dans la room privée', () => {
    service.notifierPoints('user-1', {
      soldePoints: 42,
      montant: 5,
      type: 'VISITE_QUOTIDIENNE',
    });

    expect(emettre).toHaveBeenCalledWith(
      'user:user-1',
      EVENEMENT_POINTS_MIS_A_JOUR,
      { soldePoints: 42, montant: 5, type: 'VISITE_QUOTIDIENNE' },
    );
  });

  it('diffuse le nombre réel d’utilisateurs inscrits', async () => {
    const prisma = { user: { count: jest.fn().mockResolvedValue(12) } };
    service = new RealtimeService(
      { emettre } as unknown as RealtimeGateway,
      prisma as never,
    );

    await service.notifierNombreUtilisateurs();

    expect(prisma.user.count).toHaveBeenCalledTimes(1);
    expect(emettre).toHaveBeenCalledWith('public', 'users:count', {
      nombre: 12,
    });
  });

  it('envoie la progression de streak dans la room privée', () => {
    service.notifierStreak('user-1', { streakActuel: 3, streakMax: 7 });

    expect(emettre).toHaveBeenCalledWith(
      'user:user-1',
      EVENEMENT_STREAK_MIS_A_JOUR,
      { streakActuel: 3, streakMax: 7 },
    );
  });

  it('envoie le déblocage de carte dans la room privée', () => {
    service.notifierCarteDebloquee('user-1', {
      carteId: 'carte-1',
      streakPalier: 3,
    });

    expect(emettre).toHaveBeenCalledWith(
      'user:user-1',
      EVENEMENT_CARTE_DEBLOQUEE,
      { carteId: 'carte-1', streakPalier: 3 },
    );
  });

  it('notifie la room privée après une modification d’appariement', () => {
    service.notifierAppariements('user-1', { raison: 'revocation' });

    expect(emettre).toHaveBeenCalledWith(
      'user:user-1',
      EVENEMENT_APPARIEMENTS_MIS_A_JOUR,
      { raison: 'revocation' },
    );
  });

  // ─── Notifications de tirage ───────────────────────────────────────────────
  it('envoie le statut de tirage dans la room commune', () => {
    service.notifierStatutTirage({ raffleId: 'raffle-1', statut: 'CLOTURE' });

    expect(emettre).toHaveBeenCalledWith(
      ROOM_TIRAGES,
      EVENEMENT_TIRAGE_STATUT,
      {
        raffleId: 'raffle-1',
        statut: 'CLOTURE',
      },
    );
  });

  it('envoie le résultat de tirage dans la room commune', () => {
    const donnees = {
      raffleId: 'raffle-1',
      graineAleatoire: 'abcdef',
      empreinteParticipants: '123456',
      resultatPublieAt: new Date('2026-01-01T00:00:00.000Z'),
      nombreTickets: 12,
      gagnants: [{ lotId: 'lot-1', ticketId: 'ticket-1' }],
    };

    service.notifierResultatTirage(donnees);

    expect(emettre).toHaveBeenCalledWith(
      ROOM_TIRAGES,
      EVENEMENT_TIRAGE_RESULTAT,
      donnees,
    );
  });
});
