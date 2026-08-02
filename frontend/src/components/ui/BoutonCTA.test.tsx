import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoutonCTA } from './BoutonCTA';

test('affiche son contenu et déclenche le clic', async () => {
  const onClick = vi.fn();
  render(<BoutonCTA onClick={onClick}>Je commence</BoutonCTA>);

  const bouton = screen.getByRole('button', { name: 'Je commence' });
  await userEvent.click(bouton);

  expect(onClick).toHaveBeenCalledOnce();
});
