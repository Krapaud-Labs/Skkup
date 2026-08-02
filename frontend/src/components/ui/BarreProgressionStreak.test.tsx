import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarreProgressionStreak } from './BarreProgressionStreak';

test('calcule le pourcentage de progression vers le prochain palier', () => {
  render(<BarreProgressionStreak streakActuel={3} prochainPalier={6} />);

  const barre = screen.getByRole('progressbar');
  expect(barre.getAttribute('aria-valuenow')).toBe('50');
  expect(screen.getByText('3 jours')).toBeDefined();
  expect(screen.getByText('Prochain palier : 6 jours')).toBeDefined();
});

test('plafonne le pourcentage à 100 même si le streak dépasse le palier', () => {
  render(<BarreProgressionStreak streakActuel={10} prochainPalier={6} />);

  const barre = screen.getByRole('progressbar');
  expect(barre.getAttribute('aria-valuenow')).toBe('100');
});
