export type Theme = 'sombre' | 'clair';
export type Langue = 'fr' | 'en';
export type StatutPresence = 'enLigne' | 'horsLigne';
export type ModeNotification = 'systeme' | 'discret' | 'aucune';

export interface ConfigUtilisateurResponse {
  type: 'configUtilisateur';
  idUtilisateur: string;
  alias: string | null;
  theme: Theme;
  langue: Langue;
  statutPresence: StatutPresence;
  vuLaDerniereFois: string | null;
  modeNotification: ModeNotification;
}
