import {
  dashboardBlocksAnchorDate,
  validateDashboardBlocksSeedTarget,
} from './seed-dashboard-blocks-local.guard';

const safeEnvironment = {
  DASHBOARD_BLOCKS_SEED: '1',
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/skkup',
  DASHBOARD_BLOCKS_LOCAL_DB_CONFIRM: 'skkup',
};

describe('garde du seed local dashboard', () => {
  it('accepte uniquement une cible PostgreSQL loopback explicitement confirmée', () => {
    expect(validateDashboardBlocksSeedTarget(safeEnvironment)).toEqual({
      connectionString: safeEnvironment.DATABASE_URL,
      databaseName: 'skkup',
    });
  });

  it('accepte le nom exact de la base E2E isolée quand elle est exposée en loopback', () => {
    const environment = {
      ...safeEnvironment,
      DATABASE_URL: 'postgresql://qa:qa@127.0.0.1:5432/skkup_qa',
      DASHBOARD_BLOCKS_LOCAL_DB_CONFIRM: 'skkup_qa',
      NODE_ENV: 'test',
    };
    expect(validateDashboardBlocksSeedTarget(environment)).toEqual({
      connectionString: environment.DATABASE_URL,
      databaseName: 'skkup_qa',
    });
  });

  it('retire le paramètre Prisma schema=public avant de retourner le DSN', () => {
    const environment = {
      ...safeEnvironment,
      DATABASE_URL:
        'postgresql://local:local@127.0.0.1:5432/skkup?schema=public',
    };
    expect(
      validateDashboardBlocksSeedTarget(environment).connectionString,
    ).toBe('postgresql://local:local@127.0.0.1:5432/skkup');
  });

  it.each([
    [{ ...safeEnvironment, DASHBOARD_BLOCKS_SEED: undefined }],
    [{ ...safeEnvironment, NODE_ENV: 'production' }],
    [{ ...safeEnvironment, DATABASE_URL: 'postgresql://hosted.example/db' }],
    [{ ...safeEnvironment, DATABASE_URL: 'postgresql://localhost/production' }],
    [{ ...safeEnvironment, DASHBOARD_BLOCKS_LOCAL_DB_CONFIRM: 'skkup_test' }],
    [
      {
        ...safeEnvironment,
        DATABASE_URL:
          'postgresql://local:local@127.0.0.1:5432/skkup?host=db.example.invalid',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL:
          'postgresql://local:local@127.0.0.1:5432/skkup?hostaddr=203.0.113.10',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL:
          'postgresql://local:local@127.0.0.1:5432/skkup?service=production',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/skkup?port=5432',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://127.0.0.1@db.example.invalid:5432/skkup',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://local:local@127.0.0.1:0/skkup',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://local%ZZ:pw@127.0.0.1:5432/skkup',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://:pw@127.0.0.1:5432/skkup',
      },
    ],
    [
      {
        ...safeEnvironment,
        DATABASE_URL:
          'postgresql://local:local@127.0.0.1:5432/skkup#host=db.example.invalid',
      },
    ],
  ])('refuse la configuration non locale %j', (environment) => {
    expect(() => validateDashboardBlocksSeedTarget(environment)).toThrow(
      'Seed refusé',
    );
  });

  it('stabilise l’ancre à midi UTC et valide les dates fournies', () => {
    expect(dashboardBlocksAnchorDate('2026-11-09').toISOString()).toBe(
      '2026-11-09T12:00:00.000Z',
    );
    expect(() => dashboardBlocksAnchorDate('2026-02-30')).toThrow(
      'date valide',
    );
  });
});
