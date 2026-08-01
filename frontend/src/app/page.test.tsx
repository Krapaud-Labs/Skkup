import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Vérifie que la page d'accueil (placeholder) affiche bien le titre du
// projet, le temps que le vrai contenu soit implémenté.
test('affiche le titre du projet', () => {
  render(<Home />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Viewer Rewards' }),
  ).toBeDefined();
});
