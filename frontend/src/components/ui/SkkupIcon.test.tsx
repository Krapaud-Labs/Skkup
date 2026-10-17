import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkkupIcon, type SkkupIconName } from './SkkupIcon';

const v3Icons: SkkupIconName[] = [
  'analytics', 'audit', 'content', 'moderation', 'scratchCard', 'ticket', 'flame',
];

describe('registre d’icônes DASH-V3', () => {
  it('expose chaque asset V3 ou généré sans retomber sur un emoji ou une icône générique', () => {
    for (const name of v3Icons) {
      const { container, unmount } = render(<SkkupIcon name={name} />);
      const image = container.querySelector('img');
      const inline = container.querySelector('svg');
      expect(image ?? inline, name).not.toBeNull();
      if (image) {
        const source = image.getAttribute('src');
        expect(source, name).toMatch(/\/branding\/(v3|generated)\//);
      }
      unmount();
    }
  });

  it('utilise l’icône générée actuelle pour les cartes à gratter', () => {
    const { container } = render(<SkkupIcon name="scratchCard" />);

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/assets/dashboard/shared/icons/skkup-icon-scratch-card.png',
    );
  });

  it('rend les icônes décoratives non verbales ignorées par les technologies d’assistance', () => {
    const { container } = render(<SkkupIcon name="analytics" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('permet à la vitrine de conserver les pictogrammes SVG inline', () => {
    const { container } = render(<SkkupIcon name="shield" preferSvg />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
