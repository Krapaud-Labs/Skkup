import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

test("affiche le titre et mène vers la connexion", () => {
  render(<Home />);
  const heading = screen.getByRole('heading', {
    level: 1,
    name: /Regarder, c'est déjà gagner/i,
  });
  expect(heading).toBeDefined();
  expect(heading.previousElementSibling).toBeNull();
  expect(
    screen
      .getByRole('link', { name: 'Je commence gratuitement' })
      .getAttribute('href'),
  ).toBe('/connexion');
});
