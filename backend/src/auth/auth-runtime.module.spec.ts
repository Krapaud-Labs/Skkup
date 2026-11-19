import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { SessionRevocationService } from './session-revocation.service';

describe('AuthRuntimeModule composition', () => {
  it('composes Auth, Realtime and Admin without a cycle and shares one revocation service', async () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'composition-test-secret';
    const instancesReceivingGatewaySubscription =
      new Set<SessionRevocationService>();
    const originalSubscribe = SessionRevocationService.prototype.abonner;
    const subscribeSpy = jest
      .spyOn(SessionRevocationService.prototype, 'abonner')
      .mockImplementation(function (
        this: SessionRevocationService,
        ...args: Parameters<SessionRevocationService['abonner']>
      ) {
        instancesReceivingGatewaySubscription.add(this);
        return originalSubscribe.apply(this, args);
      });

    try {
      const moduleRef = await Test.createTestingModule({
        imports: [
          PrismaModule,
          ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10 }]),
          AuthModule,
          RealtimeModule,
          AdminUsersModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile();

      const authRevocation = (
        moduleRef.get(AuthService) as unknown as {
          sessionRevocation: SessionRevocationService;
        }
      ).sessionRevocation;
      moduleRef.get(RealtimeGateway);
      const adminRevocation = (
        moduleRef.get(AdminUsersService) as unknown as {
          sessionRevocation: SessionRevocationService;
        }
      ).sessionRevocation;

      expect(authRevocation).toBeInstanceOf(SessionRevocationService);
      expect(instancesReceivingGatewaySubscription).toEqual(
        new Set([authRevocation]),
      );
      expect(adminRevocation).toBe(authRevocation);

      await moduleRef.close();
    } finally {
      subscribeSpy.mockRestore();
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });
});
