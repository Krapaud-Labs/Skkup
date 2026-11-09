import {
  buildDashboardBlocksFixturePlan,
  DASHBOARD_BLOCKS_FIXTURE_IDS,
} from './seed-dashboard-blocks-local.fixture';

const ANCHOR = new Date('2026-11-09T12:00:00.000Z');
const ADMIN_ID = 'fixture-admin-id';
const VIEWER_ID = 'fixture-viewer-id';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysBefore(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}

describe('plan pur des fixtures dashboard locales', () => {
  it('produit les mêmes IDs et contenus avec les mêmes entrées', () => {
    const first = buildDashboardBlocksFixturePlan(ANCHOR, ADMIN_ID, VIEWER_ID);
    const second = buildDashboardBlocksFixturePlan(ANCHOR, ADMIN_ID, VIEWER_ID);

    expect(first).toEqual(second);
    expect(first.raffles.map(({ id }) => id)).toEqual(
      DASHBOARD_BLOCKS_FIXTURE_IDS.raffles,
    );
    expect(first.lots.map(({ id }) => id)).toEqual(
      DASHBOARD_BLOCKS_FIXTURE_IDS.lots,
    );
    expect(first.auditEvents.map(({ id }) => id)).toEqual(
      DASHBOARD_BLOCKS_FIXTURE_IDS.auditEvents,
    );
    expect('users' in first).toBe(false);
  });

  it('couvre les statuts Admin et le volume des listes bornées', () => {
    const plan = buildDashboardBlocksFixturePlan(ANCHOR, ADMIN_ID, VIEWER_ID);

    expect(plan.raffles.map(({ statut }) => statut)).toEqual([
      'OUVERT',
      'CLOTURE',
    ]);
    expect(plan.lots.map(({ quantite }) => quantite)).toEqual([4, 1, 0, 2]);
    expect(plan.announcements.map(({ status }) => status)).toEqual([
      'PUBLISHED',
      'ARCHIVED',
    ]);
    expect(plan.fraudFlags).toHaveLength(7);
    expect(
      plan.fraudFlags.filter(({ statut }) => statut === 'OUVERTE'),
    ).toHaveLength(5);
    expect(
      plan.fraudFlags.filter(({ statut }) => statut === 'EXAMINEE'),
    ).toHaveLength(2);
    expect(plan.streams.map(({ actif }) => actif)).toEqual([true, false]);
    expect(plan.streams.map(({ createdAt }) => createdAt)).toEqual([
      daysBefore(ANCHOR, 5),
      daysBefore(ANCHOR, 12),
    ]);
    expect(plan.contents.map(({ status }) => status)).toEqual([
      'PUBLISHED',
      'DRAFT',
    ]);
    expect(
      plan.contents.map(({ createdAt, updatedAt }) => [createdAt, updatedAt]),
    ).toEqual([
      [daysBefore(ANCHOR, 30), daysBefore(ANCHOR, 2)],
      [daysBefore(ANCHOR, 20), daysBefore(ANCHOR, 1)],
    ]);
    expect(plan.auditEvents).toHaveLength(8);
  });

  it('couvre l’activité Viewer récente/ancienne, les sessions, cartes et tickets', () => {
    const plan = buildDashboardBlocksFixturePlan(ANCHOR, ADMIN_ID, VIEWER_ID);

    expect(plan.sessions).toHaveLength(3);
    expect(
      plan.sessions.map(({ dernierHeartbeatAt }) => dernierHeartbeatAt),
    ).toEqual([
      daysBefore(ANCHOR, 1),
      daysBefore(ANCHOR, 3),
      daysBefore(ANCHOR, 19),
    ]);
    expect(
      plan.transactions.map(({ type, montant }) => [type, montant]),
    ).toEqual([
      ['VISITE_QUOTIDIENNE', 5],
      ['WATCH_TIME', 15],
      ['CARTE_A_GRATTER', 0],
      ['VISITE_QUOTIDIENNE', 5],
    ]);
    expect(plan.transactions[1].watchSessionId).toBe(plan.sessions[0].id);
    expect(plan.transactions[3].createdAt).toEqual(daysBefore(ANCHOR, 25));
    expect(plan.scratchCards.map(({ grattee }) => grattee)).toEqual([
      false,
      false,
      true,
    ]);
    expect(plan.tickets.map(({ raffleId }) => raffleId)).toEqual(
      DASHBOARD_BLOCKS_FIXTURE_IDS.raffles,
    );
    expect(plan.tickets.map(({ userId }) => userId)).toEqual([
      VIEWER_ID,
      VIEWER_ID,
    ]);
  });

  it('calcule les dates de façon stable par rapport à l’ancre fournie', () => {
    const plan = buildDashboardBlocksFixturePlan(ANCHOR, ADMIN_ID, VIEWER_ID);

    expect(plan.raffles[0].dateOuverture).toEqual(daysBefore(ANCHOR, 2));
    expect(plan.raffles[0].dateTirage).toEqual(
      new Date(ANCHOR.getTime() + 7 * DAY_MS),
    );
    expect(plan.raffles[1].dateTirage).toEqual(daysBefore(ANCHOR, 12));
    expect(plan.auditEvents.map(({ createdAt }) => createdAt)).toEqual(
      Array.from({ length: 8 }, (_, index) => daysBefore(ANCHOR, index)),
    );
    expect(
      plan.announcements.every(({ createdById }) => createdById === ADMIN_ID),
    ).toBe(true);
    expect(plan.auditEvents.every(({ actorId }) => actorId === ADMIN_ID)).toBe(
      true,
    );
  });
});
