import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CarteGlow } from './CarteGlow';

test('affiche son contenu', () => {
  render(<CarteGlow>Contenu de la carte</CarteGlow>);
  expect(screen.getByText('Contenu de la carte')).toBeDefined();
});
