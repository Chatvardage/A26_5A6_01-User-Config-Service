import {
  motDePasseUrl,
  problemesSecretsProduction,
  verifierSecretsProduction,
} from './secrets-production';

const URL_DEV = 'postgresql://config_service:config_service_dev@db/config';

describe('secrets de production', () => {
  it('ne vérifie rien hors production', () => {
    for (const NODE_ENV of [undefined, 'development', 'test']) {
      expect(
        problemesSecretsProduction({ NODE_ENV, DATABASE_URL: URL_DEV }),
      ).toEqual([]);
    }
  });

  it('accepte un vrai mot de passe (ou aucun) en production', () => {
    for (const DATABASE_URL of [
      'postgresql://config_service:vrai-secret@db/config',
      'postgresql://config_service@db/config',
      undefined,
    ]) {
      expect(() =>
        verifierSecretsProduction({ NODE_ENV: ' production ', DATABASE_URL }),
      ).not.toThrow();
    }
  });

  it('refuse le mot de passe de développement en production', () => {
    expect(() =>
      verifierSecretsProduction({
        NODE_ENV: 'production',
        DATABASE_URL: URL_DEV,
      }),
    ).toThrow(/NODE_ENV=production.*DATABASE_URL/);
  });

  it('lit le mot de passe d’une URL de connexion', () => {
    expect(motDePasseUrl('postgresql://u:p%40ss@h/b')).toBe('p@ss');
    expect(motDePasseUrl('pas une url')).toBeNull();
  });

  it('utilise process.env par défaut', () => {
    const precedent = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      expect(() => verifierSecretsProduction()).not.toThrow();
    } finally {
      process.env.NODE_ENV = precedent;
    }
  });
});
