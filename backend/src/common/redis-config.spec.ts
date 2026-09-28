import { requireRedisUrl } from './redis-config';

describe('configuration Redis', () => {
  it('retourne une URL Redis définie', () => {
    expect(requireRedisUrl('redis://:test-password@redis:6379')).toBe(
      'redis://:test-password@redis:6379',
    );
  });

  it.each([undefined, ''])('refuse une URL Redis absente ou vide', (value) => {
    expect(() => requireRedisUrl(value)).toThrow('REDIS_URL is required.');
  });
});
