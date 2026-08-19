import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

test("affiche le titre et mène vers l'inscription", () => {
  render(<Home />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Skuup' }),
  ).toBeDefined();
  expect(
    screen
      .getByRole('link', { name: 'Je commence gratuitement' })
      .getAttribute('href'),
  ).toBe('/inscription');
});
