import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Démonte les composants rendus après chaque test pour éviter les
// collisions entre plusieurs rendus dans un même fichier de test.
afterEach(() => {
  cleanup();
});
