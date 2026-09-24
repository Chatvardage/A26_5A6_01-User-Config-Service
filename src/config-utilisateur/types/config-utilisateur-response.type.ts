import {
  Langue,
  ModeNotification,
  StatutPresence,
  Theme,
} from '@prisma/client';

export interface ConfigUtilisateurResponse {
  type: 'configUtilisateur';
  idUtilisateur: string;
  alias: string | null;
  theme: Theme;
  langue: Langue;
  statutPresence: StatutPresence;
  vuLaDerniereFois: string | null;
  modeNotification: ModeNotification;
  avatar: string | null;
}
