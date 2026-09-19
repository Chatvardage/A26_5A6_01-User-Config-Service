import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MettreAJourConfigDto } from './mettre-a-jour-config.dto';

const valider = (valeurs: Record<string, unknown>) =>
  validate(plainToInstance(MettreAJourConfigDto, valeurs));

describe('MettreAJourConfigDto', () => {
  it('accepte un objet vide (tous les champs omis)', async () => {
    expect(await valider({})).toEqual([]);
  });

  it('accepte des valeurs valides', async () => {
    expect(
      await valider({
        alias: 'Ariane',
        theme: 'clair',
        langue: 'en',
        modeNotification: 'discret',
      }),
    ).toEqual([]);
  });

  it.each(['alias', 'theme', 'langue', 'modeNotification'])(
    'rejette %s explicitement null',
    async (champ) => {
      const erreurs = await valider({ [champ]: null });
      expect(erreurs).toHaveLength(1);
      expect(erreurs[0].property).toBe(champ);
    },
  );

  it('rejette un alias trop long', async () => {
    const erreurs = await valider({ alias: 'a'.repeat(51) });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints).toHaveProperty('maxLength');
  });

  it('valide la longueur de l’alias après avoir retiré ses espaces externes', async () => {
    const dto = plainToInstance(MettreAJourConfigDto, {
      alias: `  ${'a'.repeat(50)}  `,
    });

    expect(dto.alias).toBe('a'.repeat(50));
    expect(await validate(dto)).toEqual([]);
  });

  it('rejette un thème inconnu', async () => {
    const erreurs = await valider({ theme: 'bleu' });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints).toHaveProperty('isEnum');
  });
});
