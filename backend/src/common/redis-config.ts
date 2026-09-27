export function requireRedisUrl(value: string | undefined): string {
  if (!value) {
    throw new Error('REDIS_URL is required.');
  }
  return value;
}
