import { StatutPresence } from '@prisma/client';

/**
 * Sous-ensemble PUBLIC de la configuration d'un utilisateur, lisible par
 * n'importe quel utilisateur authentifié (voir GET /config-utilisateur/publiques).
 * Ne jamais y ajouter de préférence privée (thème, langue, notifications).
 */
export interface ProfilPublicResponse {
  type: 'profilPublic';
  idUtilisateur: string;
  alias: string | null;
  /** Omis si `inclureAvatar=false`. */
  avatar?: string | null;
  /** Statut CHOISI par l'utilisateur (peut être périmé, voir `actif`). */
  statutPresence: StatutPresence;
  vuLaDerniereFois: string | null;
  /**
   * Présence EFFECTIVE : `enLigne` ET signe de vie récent (voir
   * DELAI_PRESENCE_ACTIVE_MS). Calculé ici plutôt que côté client pour ne
   * pas dépendre de l'horloge de chaque machine.
   */
  actif: boolean;
}
