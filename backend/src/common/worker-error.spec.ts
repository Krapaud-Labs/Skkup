import { erreurWorker } from './worker-error';

describe('erreurWorker', () => {
  it('ne conserve jamais le message ni la pile de l’erreur d’origine', () => {
    const originale = new Error('SECRET_TEST redis://user:password@host');
    originale.stack = `Error: ${originale.message}\n at SECRET_TEST`;

    const resultat = erreurWorker();

    expect(resultat.message).toBe('Worker job failed.');
    expect(resultat.message).not.toContain('SECRET_TEST');
    expect(resultat.stack).not.toContain('SECRET_TEST');
  });
});
