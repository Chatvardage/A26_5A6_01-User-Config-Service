import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigUtilisateur, StatutPresence } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MettreAJourConfigDto } from './dto/mettre-a-jour-config.dto';
import { ConfigUtilisateurResponse } from './types/config-utilisateur-response.type';

@Injectable()
export class ConfigUtilisateurService {
  constructor(private readonly prisma: PrismaService) {}

  async recupererOuCreer(
    idUtilisateur: string,
  ): Promise<ConfigUtilisateurResponse> {
    const config = await this.prisma.configUtilisateur.upsert({
      where: { idUtilisateur },
      update: {},
      create: { idUtilisateur },
    });
    return this.versReponse(config);
  }

  async mettreAJour(
    idUtilisateur: string,
    dto: MettreAJourConfigDto,
  ): Promise<ConfigUtilisateurResponse> {
    if (
      dto.alias === undefined &&
      dto.theme === undefined &&
      dto.langue === undefined &&
      dto.modeNotification === undefined
    ) {
      throw new BadRequestException('Aucune modification fournie');
    }

    const donnees = {
      ...(dto.alias !== undefined
        ? { alias: dto.alias.trim() === '' ? null : dto.alias.trim() }
        : {}),
      ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
      ...(dto.langue !== undefined ? { langue: dto.langue } : {}),
      ...(dto.modeNotification !== undefined
        ? { modeNotification: dto.modeNotification }
        : {}),
    };

    const config = await this.prisma.configUtilisateur.upsert({
      where: { idUtilisateur },
      update: donnees,
      create: { idUtilisateur, ...donnees },
    });
    return this.versReponse(config);
  }

  async definirPresence(
    idUtilisateur: string,
    statut: StatutPresence,
  ): Promise<ConfigUtilisateurResponse> {
    // Mis à jour même en passant horsLigne : c'est justement l'instant de la
    // déconnexion qui doit être affiché comme « vu(e) pour la dernière fois ».
    const vuLaDerniereFois = new Date();
    const config = await this.prisma.configUtilisateur.upsert({
      where: { idUtilisateur },
      update: { statutPresence: statut, vuLaDerniereFois },
      create: { idUtilisateur, statutPresence: statut, vuLaDerniereFois },
    });
    return this.versReponse(config);
  }

  private versReponse(config: ConfigUtilisateur): ConfigUtilisateurResponse {
    return {
      type: 'configUtilisateur',
      idUtilisateur: config.idUtilisateur,
      alias: config.alias,
      theme: config.theme,
      langue: config.langue,
      statutPresence: config.statutPresence,
      vuLaDerniereFois: config.vuLaDerniereFois
        ? config.vuLaDerniereFois.toISOString()
        : null,
      modeNotification: config.modeNotification,
    };
  }
}
