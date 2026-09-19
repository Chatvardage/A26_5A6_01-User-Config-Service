import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigUtilisateur, Prisma, StatutPresence } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MettreAJourConfigDto } from './dto/mettre-a-jour-config.dto';
import { ConfigUtilisateurResponse } from './types/config-utilisateur-response.type';

const CODE_CONTRAINTE_UNIQUE = 'P2002';

@Injectable()
export class ConfigUtilisateurService {
  constructor(private readonly prisma: PrismaService) {}

  async recupererOuCreer(
    idUtilisateur: string,
  ): Promise<ConfigUtilisateurResponse> {
    const existant = await this.prisma.configUtilisateur.findUnique({
      where: { idUtilisateur },
    });
    if (existant) {
      return this.versReponse(existant);
    }

    try {
      const config = await this.prisma.configUtilisateur.create({
        data: { idUtilisateur },
      });
      return this.versReponse(config);
    } catch (erreur) {
      // Deux premières requêtes concurrentes du même utilisateur peuvent
      // toutes deux tenter la création : on relit la ligne créée par l'autre.
      if (
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === CODE_CONTRAINTE_UNIQUE
      ) {
        // findUniqueOrThrow suppose que la ligne créée par la requête
        // concurrente existe encore : ce service ne supprime jamais de
        // ConfigUtilisateur, cette hypothèse est donc sûre ici.
        const config = await this.prisma.configUtilisateur.findUniqueOrThrow({
          where: { idUtilisateur },
        });
        return this.versReponse(config);
      }
      throw erreur;
    }
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

    // dto.alias ne peut valoir que string|undefined ici, jamais null : le
    // ValidationPipe global (@ValidateIf du DTO) rejette null en 400 avant
    // d'atteindre ce service. Le trim idempotent préserve aussi cette
    // normalisation pour un appel direct avec un DTO déjà valide.
    const aliasTrim = dto.alias?.trim();
    const donnees = {
      ...(aliasTrim !== undefined
        ? { alias: aliasTrim === '' ? null : aliasTrim }
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
