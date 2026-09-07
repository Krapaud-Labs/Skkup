import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';
import { proxy } from './proxy';

describe('proxy', () => {
  test('redirige www vers le domaine canonique sans exposer le port interne', () => {
    const request = new NextRequest('https://skkup.fr:3000/dashboard', {
      headers: {
        host: 'www.skkup.fr:3000',
      },
    });
    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://skkup.fr/dashboard',
    );
  });

  test('laisse passer le domaine canonique', () => {
    const request = new NextRequest('https://skkup.fr/');
    const response = proxy(request);

    expect(response.status).toBe(200);
  });
});
