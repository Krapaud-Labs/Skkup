import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

async function erreursPour(motDePasse: string): Promise<number> {
  const dto = new RegisterDto();
  dto.email = 'test@example.com';
  dto.pseudo = 'testeur';
  dto.motDePasse = motDePasse;
  return (await validate(dto)).filter((erreur) => erreur.property === 'motDePasse').length;
}

describe('RegisterDto', () => {
  it('impose la même politique forte que le changement de mot de passe', async () => {
    expect(await erreursPour('court1A')).toBeGreaterThan(0);
    expect(await erreursPour('motdepasseassezlong')).toBeGreaterThan(0);
    expect(await erreursPour('MOTDEPASSEASSEZ1')).toBeGreaterThan(0);
    expect(await erreursPour('Motdepasseassez')).toBeGreaterThan(0);
    expect(await erreursPour('Motdepasseassez1')).toBe(0);
  });
});
