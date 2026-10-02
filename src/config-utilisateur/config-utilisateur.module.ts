import { Module } from '@nestjs/common';
import { InternalController } from '../internal/internal.controller';
import { InternalTokenGuard } from '../internal/internal-token.guard';
import { ConfigUtilisateurController } from './config-utilisateur.controller';
import { ConfigUtilisateurService } from './config-utilisateur.service';

@Module({
  controllers: [ConfigUtilisateurController, InternalController],
  providers: [ConfigUtilisateurService, InternalTokenGuard],
  exports: [ConfigUtilisateurService],
})
export class ConfigUtilisateurModule {}
