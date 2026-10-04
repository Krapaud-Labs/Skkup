import { validate } from 'class-validator';
import { CreateRaffleLotDto } from './create-raffle.dto';

describe('CreateRaffleLotDto imageUrl', () => {
  it('accepts a real HTTPS media URL', async () => {
    const dto = Object.assign(new CreateRaffleLotDto(), {
      nom: 'Casque', valeurEstimee: '99.90', quantite: 1,
      fournisseur: 'Sponsor', imageUrl: 'https://cdn.example.com/casque.jpg',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects non-HTTPS media URLs', async () => {
    const dto = Object.assign(new CreateRaffleLotDto(), {
      nom: 'Casque', valeurEstimee: '99.90', quantite: 1,
      fournisseur: 'Sponsor', imageUrl: 'data:image/png;base64,not-a-file',
    });
    expect((await validate(dto)).some((error) => error.property === 'imageUrl')).toBe(true);
  });
});
