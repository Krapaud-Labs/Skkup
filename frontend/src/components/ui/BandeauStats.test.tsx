import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BandeauStats } from './BandeauStats';
import { imagesForSource } from '@/test-utils/next-image';

test('affiche chaque statistique avec sa valeur et son libellé', () => {
  const { container } = render(
    <BandeauStats
      statistiques={[
        { valeur: '42', libelle: 'membres inscrits' },
        { valeur: '7', libelle: 'tirages réalisés' },
      ]}
    />,
  );

  expect(screen.getByText('42')).toBeDefined();
  expect(screen.getByText('membres inscrits')).toBeDefined();
  expect(screen.getByText('7')).toBeDefined();
  expect(screen.getByText('tirages réalisés')).toBeDefined();
  expect(container.firstElementChild?.className).toContain('sm:grid-cols-3');
});

test('rend le PNG décoratif du dashboard seulement dans le bandeau intégré', () => {
  const { container } = render(<BandeauStats embedded statistiques={[{ valeur: '1', libelle: 'Série' }]} />);

  expect(imagesForSource(container, '/assets/icons/ui/sparkle.png')).not.toHaveLength(0);
});

test('affiche les icônes KPI points, série et ticket à 48px sans cadre', () => {
  const { container } = render(
    <BandeauStats
      embedded
      statistiques={[
        { valeur: '120', libelle: 'Points', icone: 'points' },
        { valeur: '3 j', libelle: 'Série', icone: 'flame' },
        { valeur: '2', libelle: 'Tickets', icone: 'ticket' },
      ]}
    />,
  );

  for (const icon of ['points', 'flame', 'ticket'] as const) {
    const image = imagesForSource(container, `/assets/icons/ui/${icon}.png`)[0];

    expect(image, icon).toBeDefined();
    expect(image?.getAttribute('width'), icon).toBe('48');
    expect(image?.getAttribute('height'), icon).toBe('48');
    expect(image?.parentElement?.className, icon).toContain('skuup-stat-icon-image');
  }
});
