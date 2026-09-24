import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ListerProfilsPublicsDto,
  NOMBRE_MAX_IDS_PUBLICS,
} from './lister-profils-publics.dto';

const convertir = (valeurs: Record<string, unknown>) =>
  plainToInstance(ListerProfilsPublicsDto, valeurs);

const valider = (valeurs: Record<string, unknown>) =>
  validate(convertir(valeurs));

describe('ListerProfilsPublicsDto', () => {
  it('découpe la query string, retire les espaces, les vides et les doublons', () => {
    expect(convertir({ ids: ' a, b,,a ,c ' }).ids).toEqual(['a', 'b', 'c']);
  });

  it('laisse une valeur déjà sous forme de tableau telle quelle', () => {
    expect(convertir({ ids: ['a', 'b'] }).ids).toEqual(['a', 'b']);
  });

  it('accepte des identifiants valides, sans inclureAvatar', async () => {
    expect(await valider({ ids: 'user-1,user-2' })).toEqual([]);
  });

  it('rejette une liste vide', async () => {
    const erreurs = await valider({ ids: ' , ' });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].property).toBe('ids');
  });

  it(`rejette plus de ${NOMBRE_MAX_IDS_PUBLICS} identifiants`, async () => {
    const ids = Array.from(
      { length: NOMBRE_MAX_IDS_PUBLICS + 1 },
      (_, i) => `u${i}`,
    ).join(',');
    const erreurs = await valider({ ids });
    expect(erreurs[0].property).toBe('ids');
  });

  it('rejette un identifiant trop long', async () => {
    const erreurs = await valider({ ids: 'a'.repeat(256) });
    expect(erreurs[0].property).toBe('ids');
  });

  it.each([
    ['false', false],
    ['true', true],
  ])('convertit inclureAvatar=%s en booléen', async (brut, attendu) => {
    const dto = convertir({ ids: 'a', inclureAvatar: brut });
    expect(dto.inclureAvatar).toBe(attendu);
    expect(await validate(dto)).toEqual([]);
  });

  it('rejette un inclureAvatar qui n’est pas un booléen', async () => {
    const erreurs = await valider({ ids: 'a', inclureAvatar: 'oui' });
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].property).toBe('inclureAvatar');
  });
});
