import { UnauthorizedException } from '@nestjs/common';
import { ConfigUtilisateurController } from './config-utilisateur.controller';

describe('ConfigUtilisateurController', () => {
  let c: ConfigUtilisateurController;
  let s: any;

  beforeEach(() => {
    s = Object.fromEntries(
      [
        'recupererOuCreer',
        'mettreAJour',
        'definirPresence',
        'listerProfilsPublics',
      ].map((k) => [k, jest.fn().mockResolvedValue(k)]),
    );
    c = new ConfigUtilisateurController(s);
  });

  it('recupererMaConfig délègue au service', () => {
    c.recupererMaConfig('user-1');
    expect(s.recupererOuCreer).toHaveBeenCalledWith('user-1');
  });

  it('recupererMaConfig nettoie les espaces autour de l’identifiant', () => {
    c.recupererMaConfig('  user-1  ');
    expect(s.recupererOuCreer).toHaveBeenCalledWith('user-1');
  });

  it('mettreAJourMaConfig délègue au service', () => {
    c.mettreAJourMaConfig({ alias: 'x' }, 'user-1');
    expect(s.mettreAJour).toHaveBeenCalledWith('user-1', { alias: 'x' });
  });

  it('definirMaPresence délègue au service', () => {
    c.definirMaPresence({ statut: 'enLigne' }, 'user-1');
    expect(s.definirPresence).toHaveBeenCalledWith('user-1', 'enLigne');
  });

  it('listerProfilsPublics délègue au service (avatar inclus par défaut)', () => {
    c.listerProfilsPublics({ ids: ['a', 'b'] }, 'user-1');
    expect(s.listerProfilsPublics).toHaveBeenCalledWith(['a', 'b'], true);
  });

  it('listerProfilsPublics exige une identité authentifiée', () => {
    expect(() => c.listerProfilsPublics({ ids: ['a'] }, undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it.each([undefined, '', '   '])('refuse une identité invalide %p', (id) => {
    expect(() => c.recupererMaConfig(id)).toThrow(UnauthorizedException);
  });

  it('refuse un identifiant excessivement long', () => {
    expect(() => c.recupererMaConfig('u'.repeat(256))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepte un identifiant à la limite autorisée', () => {
    c.recupererMaConfig('u'.repeat(255));
    expect(s.recupererOuCreer).toHaveBeenCalledWith('u'.repeat(255));
  });
});
