import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('retourne les compteurs et une activité bornée', async () => {
    const prisma = {
      user: { count: jest.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(9) },
      raffle: { count: jest.fn().mockResolvedValue(2) },
      managedContent: { count: jest.fn().mockResolvedValue(4) },
      announcement: { count: jest.fn().mockResolvedValue(3) },
      fraudFlag: { count: jest.fn().mockResolvedValue(1) },
      stream: { count: jest.fn().mockResolvedValue(5) },
      contentAuditEvent: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'event-1', action: 'PUBLISHED', entityType: 'Content', entityId: 'content-1', createdAt: new Date(0), actor: { id: 'admin-1', pseudo: 'Admin' } },
        ]),
      },
    };
    const service = new AdminDashboardService(prisma as never);

    const summary = await service.summary();
    expect(summary.counts).toEqual({
      users: 12,
      activeUsers: 9,
      openRaffles: 2,
      publishedContent: 4,
      activeAnnouncements: 3,
      openFraudFlags: 1,
      activeStreams: 5,
    });
    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity[0]).toMatchObject({
      id: 'event-1',
      actor: { pseudo: 'Admin' },
    });
    expect(prisma.contentAuditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );
  });
});
