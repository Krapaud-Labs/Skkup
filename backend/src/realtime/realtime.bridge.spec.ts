import {
  delaiReconnexionRedis,
  messageTempsReelValide,
  publierEvenementTempsReel,
} from './realtime.bridge';
import {
  CANAL_REDIS_TEMPS_REEL,
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_TIRAGE_RESULTAT,
  ROOM_TIRAGES,
} from './realtime.constants';

describe('pont Redis temps réel', () => {
  it('borne le délai de reconnexion Redis', () => {
    expect(delaiReconnexionRedis(1)).toBe(250);
    expect(delaiReconnexionRedis(10)).toBe(2500);
    expect(delaiReconnexionRedis(100)).toBe(5000);
  });
  // ─── Publication depuis le worker ──────────────────────────────────────────
  it('publie le message sérialisé sur le canal dédié', async () => {
    const publish = jest.fn().mockResolvedValue(1);

    await publierEvenementTempsReel(
      { publish },
      {
        room: ROOM_TIRAGES,
        evenement: EVENEMENT_TIRAGE_RESULTAT,
        donnees: { raffleId: 'raffle-1' },
      },
    );

    expect(publish).toHaveBeenCalledWith(
      CANAL_REDIS_TEMPS_REEL,
      JSON.stringify({
        room: ROOM_TIRAGES,
        evenement: EVENEMENT_TIRAGE_RESULTAT,
        donnees: { raffleId: 'raffle-1' },
      }),
    );
  });

  // ─── Validation à la réception ─────────────────────────────────────────────
  it('accepte la room commune et une room privée', () => {
    expect(
      messageTempsReelValide({
        room: ROOM_TIRAGES,
        evenement: EVENEMENT_TIRAGE_RESULTAT,
        donnees: {},
      }),
    ).toBe(true);
    expect(
      messageTempsReelValide({
        room: 'user:abc123',
        evenement: EVENEMENT_POINTS_MIS_A_JOUR,
        donnees: {},
      }),
    ).toBe(true);
  });

  it('refuse un événement hors liste blanche', () => {
    expect(
      messageTempsReelValide({
        room: ROOM_TIRAGES,
        evenement: 'admin:secret',
        donnees: {},
      }),
    ).toBe(false);
  });

  it('refuse une room au format inattendu', () => {
    expect(
      messageTempsReelValide({
        room: '*',
        evenement: EVENEMENT_POINTS_MIS_A_JOUR,
        donnees: {},
      }),
    ).toBe(false);
    expect(
      messageTempsReelValide({
        room: 'user:',
        evenement: EVENEMENT_POINTS_MIS_A_JOUR,
        donnees: {},
      }),
    ).toBe(false);
  });

  it('refuse une room privée dont le nom dépasse la longueur admise', () => {
    expect(
      messageTempsReelValide({
        room: `user:${'a'.repeat(65)}`,
        evenement: EVENEMENT_POINTS_MIS_A_JOUR,
        donnees: {},
      }),
    ).toBe(false);
  });

  it('refuse un message mal formé', () => {
    expect(messageTempsReelValide(null)).toBe(false);
    expect(messageTempsReelValide('texte')).toBe(false);
    expect(messageTempsReelValide({ room: 'raffles' })).toBe(false);
  });
});
