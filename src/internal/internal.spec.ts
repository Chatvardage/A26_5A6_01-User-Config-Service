import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigUtilisateurService } from '../config-utilisateur/config-utilisateur.service';
import { InternalController } from './internal.controller';
import { InternalTokenGuard } from './internal-token.guard';

const contexte = (enTete?: string | string[]) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: enTete === undefined ? {} : { 'x-internal-token': enTete },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('jeton interne', () => {
  const ancien = process.env.INTERNAL_SERVICE_TOKEN;
  afterEach(() => {
    if (ancien === undefined) delete process.env.INTERNAL_SERVICE_TOKEN;
    else process.env.INTERNAL_SERVICE_TOKEN = ancien;
  });

  it('échoue fermé si INTERNAL_SERVICE_TOKEN n’est pas configuré', () => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
    expect(() => new InternalTokenGuard().canActivate(contexte('x'))).toThrow(
      ServiceUnavailableException,
    );
    process.env.INTERNAL_SERVICE_TOKEN = '   ';
    expect(() => new InternalTokenGuard().canActivate(contexte('x'))).toThrow(
      ServiceUnavailableException,
    );
  });

  it.each([
    ['absent', undefined],
    ['de mauvaise longueur', 'court'],
    ['faux, même longueur', 'secret-faux-1234'],
    ['en tableau', ['secret-interne-12']],
  ])('refuse un jeton %s', (_cas, enTete) => {
    process.env.INTERNAL_SERVICE_TOKEN = 'secret-interne-12';
    expect(() =>
      new InternalTokenGuard().canActivate(contexte(enTete)),
    ).toThrow(UnauthorizedException);
  });

  it('accepte le bon jeton', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'secret-interne-12';
    expect(
      new InternalTokenGuard().canActivate(contexte('secret-interne-12')),
    ).toBe(true);
  });

  it('InternalController efface la configuration d’un compte supprimé', async () => {
    const config = { supprimer: jest.fn().mockResolvedValue(false) };
    const c = new InternalController(
      config as unknown as ConfigUtilisateurService,
    );
    await expect(c.supprimerUtilisateur('parti')).resolves.toEqual({
      supprime: false,
    });
    expect(config.supprimer).toHaveBeenCalledWith('parti');
  });
});
