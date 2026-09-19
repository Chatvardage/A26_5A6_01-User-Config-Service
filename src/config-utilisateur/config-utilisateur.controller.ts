import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigUtilisateurService } from './config-utilisateur.service';
import { DefinirPresenceDto } from './dto/definir-presence.dto';
import { MettreAJourConfigDto } from './dto/mettre-a-jour-config.dto';

const LONGUEUR_MAX_ID_UTILISATEUR = 255;

@ApiTags('Configuration utilisateur')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description:
    "Identifiant de l'utilisateur authentifié, transmis par l'API Gateway",
})
@Controller('config-utilisateur')
export class ConfigUtilisateurController {
  constructor(
    private readonly configUtilisateurService: ConfigUtilisateurService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "Récupère la configuration de l'utilisateur connecté (créée avec des valeurs par défaut si elle n'existe pas encore)",
  })
  recupererMaConfig(@Headers('x-user-id') idUtilisateur?: string) {
    return this.configUtilisateurService.recupererOuCreer(
      this.exigerIdUtilisateur(idUtilisateur),
    );
  }

  @Patch()
  @ApiOperation({
    summary:
      "Met à jour l'alias, le thème, la langue ou le mode de notification de l'utilisateur connecté",
  })
  mettreAJourMaConfig(
    @Body() dto: MettreAJourConfigDto,
    @Headers('x-user-id') idUtilisateur?: string,
  ) {
    return this.configUtilisateurService.mettreAJour(
      this.exigerIdUtilisateur(idUtilisateur),
      dto,
    );
  }

  @Put('presence')
  @ApiOperation({
    summary: "Définit le statut de présence de l'utilisateur connecté",
  })
  definirMaPresence(
    @Body() dto: DefinirPresenceDto,
    @Headers('x-user-id') idUtilisateur?: string,
  ) {
    return this.configUtilisateurService.definirPresence(
      this.exigerIdUtilisateur(idUtilisateur),
      dto.statut,
    );
  }

  private exigerIdUtilisateur(idUtilisateur?: string): string {
    const identifiant = idUtilisateur?.trim();
    if (!identifiant || identifiant.length > LONGUEUR_MAX_ID_UTILISATEUR) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return identifiant;
  }
}
