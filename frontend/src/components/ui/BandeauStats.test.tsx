import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BandeauStats } from './BandeauStats';

test('affiche chaque statistique avec sa valeur et son libellé', () => {
  render(
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
});
