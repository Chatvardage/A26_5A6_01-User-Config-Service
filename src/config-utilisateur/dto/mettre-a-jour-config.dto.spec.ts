import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  LONGUEUR_MAX_AVATAR,
  MettreAJourConfigDto,
} from './mettre-a-jour-config.dto';

const AVATAR_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

  it.each(['alias', 'theme', 'langue', 'modeNotification', 'avatar'])(
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

  it('accepte un avatar en data URL PNG/JPEG/WebP', async () => {
    expect(await valider({ avatar: AVATAR_PNG })).toEqual([]);
    expect(
      await valider({ avatar: AVATAR_PNG.replace('image/png', 'image/jpeg') }),
    ).toEqual([]);
    expect(
      await valider({ avatar: AVATAR_PNG.replace('image/png', 'image/webp') }),
    ).toEqual([]);
  });

  it('accepte un avatar vide (retrait)', async () => {
    expect(await valider({ avatar: '' })).toEqual([]);
  });

  it.each([
    ['un SVG (peut contenir du script)', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['une URL distante', 'https://exemple.com/moi.png'],
    ['du base64 invalide', 'data:image/png;base64,<script>'],
  ])('rejette %s comme avatar', async (_cas, avatar) => {
    const erreurs = await valider({ avatar });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints).toHaveProperty('matches');
  });

  it('rejette un avatar trop volumineux', async () => {
    const avatar = `data:image/png;base64,${'A'.repeat(LONGUEUR_MAX_AVATAR)}`;
    const erreurs = await valider({ avatar });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints).toHaveProperty('maxLength');
  });

  it('rejette un thème inconnu', async () => {
    const erreurs = await valider({ theme: 'bleu' });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].constraints).toHaveProperty('isEnum');
  });
});
