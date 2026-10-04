import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkkupIcon, type SkkupIconName } from './SkkupIcon';

const v3Icons: SkkupIconName[] = [
  'analytics', 'audit', 'content', 'moderation', 'scratchCard', 'ticket', 'flame',
];

describe('registre d’icônes DASH-V3', () => {
  it('expose chaque asset V3 sans retomber sur un emoji ou une icône générique', () => {
    for (const name of v3Icons) {
      const { container, unmount } = render(<SkkupIcon name={name} />);
      const image = container.querySelector('img');
      expect(image, name).not.toBeNull();
      expect(image?.getAttribute('src'), name).toContain(`/branding/v3/`);
      unmount();
    }
  });

  it('rend les icônes décoratives non verbales ignorées par les technologies d’assistance', () => {
    const { container } = render(<SkkupIcon name="analytics" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('alt')).toBe('');
  });
});
