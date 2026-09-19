import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT || '3005');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Variable d'environnement PORT invalide : "${process.env.PORT}"`,
    );
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // CORS_ORIGINS est une variable de config posée par la personne qui déploie
  // (même confiance que DATABASE_URL/PORT), pas une entrée utilisateur : pas
  // de validation de format ici. Voir AGENTS.md.
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map((origine) => origine.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chatvardage User Config Service')
    .setDescription(
      'API de gestion de la configuration utilisateur de Chatvardage (alias, thème, langue, présence, notifications)',
    )
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-user-id' }, 'x-user-id')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
}

/* istanbul ignore next -- point d'entrée réel du processus, non exécuté sous Jest */
if (require.main === module) {
  bootstrap().catch((erreur: unknown) => {
    console.error(erreur);
    process.exit(1);
  });
}
