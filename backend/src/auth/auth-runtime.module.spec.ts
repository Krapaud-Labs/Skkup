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
    const originalSubscribe = Object.getOwnPropertyDescriptor(
      SessionRevocationService.prototype,
      'abonner',
    )?.value as (
      this: SessionRevocationService,
      ...args: Parameters<SessionRevocationService['abonner']>
    ) => ReturnType<SessionRevocationService['abonner']>;
    const subscribeSpy = jest
      .spyOn(SessionRevocationService.prototype, 'abonner')
      .mockImplementation(function (
        this: SessionRevocationService,
        ...args: Parameters<SessionRevocationService['abonner']>
      ) {
        instancesReceivingGatewaySubscription.add(this);
        return originalSubscribe.call(this, ...args) as () => void;
      });

    try {
      const moduleRef = await Test.createTestingModule({
        imports: [
          PrismaModule,
          ThrottlerModule.forRoot([
            { name: 'default', ttl: 60_000, limit: 10 },
          ]),
          AuthModule,
          RealtimeModule,
          AdminUsersModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile();

      const authRevocation = Reflect.get(
        moduleRef.get(AuthService),
        'sessionRevocation',
      ) as SessionRevocationService;
      moduleRef.get(RealtimeGateway);
      const adminRevocation = Reflect.get(
        moduleRef.get(AdminUsersService),
        'sessionRevocation',
      ) as SessionRevocationService;

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
