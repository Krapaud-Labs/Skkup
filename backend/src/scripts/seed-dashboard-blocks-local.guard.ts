const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_DATABASE_NAMES = new Set([
  'skkup',
  'skkup_local',
  'skkup_dev',
  'skkup_development',
  'skkup_test',
  'skkup_qa',
]);

export type DashboardBlocksSeedEnvironment = Record<string, string | undefined>;

/** Validate opt-in, runtime mode, and target before any Prisma client exists. */
export function validateDashboardBlocksSeedTarget(
  env: DashboardBlocksSeedEnvironment,
): { connectionString: string; databaseName: string } {
  if (env.DASHBOARD_BLOCKS_SEED !== '1') {
    throw new Error('Seed refusé : définir DASHBOARD_BLOCKS_SEED=1.');
  }
  if (!['development', 'test'].includes(env.NODE_ENV ?? '')) {
    throw new Error('Seed refusé : NODE_ENV doit être development ou test.');
  }

  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error('Seed refusé : DATABASE_URL absente.');

  let target: URL;
  try {
    target = new URL(connectionString);
  } catch {
    throw new Error('Seed refusé : DATABASE_URL invalide.');
  }
  if (!['postgres:', 'postgresql:'].includes(target.protocol)) {
    throw new Error('Seed refusé : seul PostgreSQL local est accepté.');
  }

  if (target.hash) {
    throw new Error(
      'Seed refusé : les fragments dans DATABASE_URL sont interdits.',
    );
  }

  const queryParameters = [...target.searchParams.entries()];
  if (
    queryParameters.length > 1 ||
    queryParameters.some(
      ([key, value]) => key !== 'schema' || value !== 'public',
    )
  ) {
    throw new Error(
      'Seed refusé : DATABASE_URL ne peut pas contenir d’override de connexion; seul schema=public est admis.',
    );
  }

  const hostname = target.hostname.replace(/^\[|\]$/gu, '').toLowerCase();
  if (!LOCAL_DATABASE_HOSTS.has(hostname)) {
    throw new Error(
      'Seed refusé : DATABASE_URL doit viser localhost ou une IP loopback.',
    );
  }

  if (!target.username) {
    throw new Error(
      'Seed refusé : un utilisateur PostgreSQL explicite est requis.',
    );
  }
  try {
    decodeURIComponent(target.username);
    decodeURIComponent(target.password);
  } catch {
    throw new Error('Seed refusé : userinfo PostgreSQL invalide.');
  }

  const port = target.port ? Number(target.port) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'Seed refusé : le port PostgreSQL doit être compris entre 1 et 65535.',
    );
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(target.pathname.slice(1));
  } catch {
    throw new Error('Seed refusé : nom de base invalide dans DATABASE_URL.');
  }
  if (!LOCAL_DATABASE_NAMES.has(databaseName)) {
    throw new Error(
      `Seed refusé : base locale non autorisée (${databaseName || 'nom absent'}).`,
    );
  }
  if (env.DASHBOARD_BLOCKS_LOCAL_DB_CONFIRM !== databaseName) {
    throw new Error(
      'Seed refusé : confirmer la cible avec DASHBOARD_BLOCKS_LOCAL_DB_CONFIRM=<nom exact de la base>.',
    );
  }

  // Pass a canonical DSN built from the validated URL object. Prisma/pg never
  // receives the original query string, where libpq options could override
  // the hostname, port, user, socket path, service, or database name.
  target.search = '';
  target.hash = '';
  target.port = String(port);
  target.pathname = `/${encodeURIComponent(databaseName)}`;
  return { connectionString: target.toString(), databaseName };
}

export function dashboardBlocksAnchorDate(
  value: string | undefined,
  now = new Date(),
): Date {
  const source = value ?? now.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(source)) {
    throw new Error('DASHBOARD_BLOCKS_SEED_DATE doit respecter AAAA-MM-JJ.');
  }
  const anchor = new Date(`${source}T12:00:00.000Z`);
  if (
    Number.isNaN(anchor.getTime()) ||
    anchor.toISOString().slice(0, 10) !== source
  ) {
    throw new Error('DASHBOARD_BLOCKS_SEED_DATE doit être une date valide.');
  }
  return anchor;
}
