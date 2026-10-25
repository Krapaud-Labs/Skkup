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
