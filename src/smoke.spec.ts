import { AppModule } from './app.module';
import { ConfigUtilisateurModule } from './config-utilisateur/config-utilisateur.module';
import { DefinirPresenceDto } from './config-utilisateur/dto/definir-presence.dto';
import { MettreAJourConfigDto } from './config-utilisateur/dto/mettre-a-jour-config.dto';
import { PrismaModule } from './prisma/prisma.module';

describe('modules et DTO', () => {
  it('sont chargeables', () => {
    expect(AppModule).toBeDefined();
    expect(PrismaModule).toBeDefined();
    expect(ConfigUtilisateurModule).toBeDefined();
    expect(new MettreAJourConfigDto()).toBeInstanceOf(MettreAJourConfigDto);
    expect(new DefinirPresenceDto()).toBeInstanceOf(DefinirPresenceDto);
  });
});
