import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

if (!window.localStorage) {
  const valeurs = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => valeurs.clear(),
      getItem: (cle: string) => valeurs.get(cle) ?? null,
      key: (index: number) => [...valeurs.keys()][index] ?? null,
      removeItem: (cle: string) => valeurs.delete(cle),
      setItem: (cle: string, valeur: string) => valeurs.set(cle, valeur),
      get length() {
        return valeurs.size;
      },
    } satisfies Storage,
  });
}

// Démonte les composants rendus après chaque test pour éviter les
// collisions entre plusieurs rendus dans un même fichier de test.
afterEach(() => {
  cleanup();
});
