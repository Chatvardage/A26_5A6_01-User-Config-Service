/**
 * Refuse de démarrer en production (`NODE_ENV=production`) avec un mot de
 * passe de base de données de DÉVELOPPEMENT connu (valeurs par défaut de
 * A26_5A6_01-Infra : `.env.example`, `docker-compose.yml`). En local, rien
 * ne change. Même règle que Room-Service et Message-Service. Ce service n'a
 * pas d'autre secret : son identité vient du Gateway (en-tête x-user-id).
 */

const MOTS_DE_PASSE_BDD_DE_DEVELOPPEMENT = [
  'config_service_dev',
  'postgres',
  'chatvardage',
];

/** Mot de passe d'une URL de connexion, ou null (absent, URL invalide). */
export function motDePasseUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const motDePasse = new URL(url).password;
    return motDePasse ? decodeURIComponent(motDePasse) : null;
  } catch {
    return null;
  }
}

export function problemesSecretsProduction(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV?.trim() !== 'production') return [];
  const motDePasse = motDePasseUrl(env.DATABASE_URL);
  return motDePasse && MOTS_DE_PASSE_BDD_DE_DEVELOPPEMENT.includes(motDePasse)
    ? ['le mot de passe de DATABASE_URL est une valeur de développement']
    : [];
}

export function verifierSecretsProduction(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const problemes = problemesSecretsProduction(env);
  if (problemes.length > 0) {
    throw new Error(
      `Secrets de développement refusés en production (NODE_ENV=production) : ${problemes.join(' ; ')}`,
    );
  }
}
