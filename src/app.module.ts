import { Module } from '@nestjs/common';
import { HealthController } from './common/health.controller';
import { ConfigUtilisateurModule } from './config-utilisateur/config-utilisateur.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigUtilisateurModule],
  controllers: [HealthController],
})
export class AppModule {}
