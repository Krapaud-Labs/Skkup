/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Prisma is intentionally mocked in this unit test. */
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('retourne les compteurs et une activité bornée', async () => {
    const prisma = {
      user: { count: jest.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(9) },
      stream: { count: jest.fn().mockResolvedValue(5) },
      contentAuditEvent: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'event-1', action: 'PUBLISHED', entityType: 'Content', entityId: 'content-1', createdAt: new Date(0), actor: { id: 'admin-1', pseudo: 'Admin' } },
        ]),
      },
      raffle: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([]) },
      raffleLot: { count: jest.fn().mockResolvedValue(48), findMany: jest.fn().mockResolvedValue([]) },
      announcement: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([]) },
      fraudFlag: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([]) },
      managedContent: { count: jest.fn().mockResolvedValue(4), findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new AdminDashboardService(prisma as never);

    const summary = (await service.summary() as unknown) as Awaited<
      ReturnType<AdminDashboardService['summary']>
    >;
    expect(summary.counts).toEqual({
      users: 12,
      activeUsers: 9,
      openRaffles: 2,
      publishedContent: 4,
      activeAnnouncements: 3,
      openFraudFlags: 1,
      activeStreams: 5,
      availableLots: 48,
    });
    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity[0]).toMatchObject({
      id: 'event-1',
      actor: { pseudo: 'Admin' },
    });
    expect(prisma.contentAuditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );
    expect(prisma.raffleLot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ imageUrl: true }),
      }),
    );
  });
});
