import { Module } from '@nestjs/common';
import { ConfigUtilisateurController } from './config-utilisateur.controller';
import { ConfigUtilisateurService } from './config-utilisateur.service';

@Module({
  controllers: [ConfigUtilisateurController],
  providers: [ConfigUtilisateurService],
  exports: [ConfigUtilisateurService],
})
export class ConfigUtilisateurModule {}
