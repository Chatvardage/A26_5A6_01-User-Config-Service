import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigUtilisateurService } from '../config-utilisateur/config-utilisateur.service';
import {
  EN_TETE_JETON_INTERNE,
  InternalTokenGuard,
} from './internal-token.guard';

@ApiTags('Interne')
@ApiHeader({ name: EN_TETE_JETON_INTERNE, required: true })
@Controller('internal')
@UseGuards(InternalTokenGuard)
export class InternalController {
  constructor(private readonly config: ConfigUtilisateurService) {}

  @Delete('users/:userId')
  @ApiOperation({
    summary:
      'Compte supprimé (pour Authentification) : efface sa configuration (alias, avatar…)',
  })
  async supprimerUtilisateur(
    @Param('userId') userId: string,
  ): Promise<{ supprime: boolean }> {
    return { supprime: await this.config.supprimer(userId) };
  }
}
