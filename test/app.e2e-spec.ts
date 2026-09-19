import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User Config Service (e2e)', () => {
  let app: INestApplication;
  const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: queryRaw,
        configUtilisateur: {
          findUnique: jest.fn().mockResolvedValue({
            idUtilisateur: 'user-1',
            alias: null,
            theme: 'sombre',
            langue: 'fr',
            statutPresence: 'horsLigne',
            vuLaDerniereFois: null,
            modeNotification: 'systeme',
            creeLe: new Date(),
            misAJourLe: new Date(),
          }),
          upsert: jest.fn().mockResolvedValue({
            idUtilisateur: 'user-1',
            alias: null,
            theme: 'sombre',
            langue: 'fr',
            statutPresence: 'horsLigne',
            vuLaDerniereFois: null,
            modeNotification: 'systeme',
            creeLe: new Date(),
            misAJourLe: new Date(),
          }),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /api/health', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'user-config-service',
        database: 'ok',
      }),
    );
  });

  it('GET /api/health retourne 503 si la base est indisponible', async () => {
    queryRaw.mockRejectedValueOnce(new Error('connexion refusée'));
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'erreur',
        service: 'user-config-service',
        database: 'erreur',
      }),
    );
  });

  it('GET /api/config-utilisateur exige une identité authentifiée', () =>
    request(app.getHttpServer()).get('/api/config-utilisateur').expect(401));

  it('GET /api/config-utilisateur retourne la config par défaut', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        theme: 'sombre',
      }),
    );
  });

  it('PATCH /api/config-utilisateur exige une identité authentifiée', () =>
    request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .send({ alias: 'x' })
      .expect(401));

  it('PATCH /api/config-utilisateur rejette un alias trop long', () =>
    request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .send({ alias: 'a'.repeat(51) })
      .expect(400));

  it('PATCH /api/config-utilisateur rejette un thème inconnu', () =>
    request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .send({ theme: 'bleu' })
      .expect(400));

  it('PATCH /api/config-utilisateur rejette un alias explicitement null', () =>
    request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .send({ alias: null })
      .expect(400));

  it('PATCH /api/config-utilisateur rejette un thème explicitement null', () =>
    request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .send({ theme: null })
      .expect(400));

  it('PUT /api/config-utilisateur/presence rejette un statut inconnu', () =>
    request(app.getHttpServer())
      .put('/api/config-utilisateur/presence')
      .set('x-user-id', 'user-1')
      .send({ statut: 'absent' })
      .expect(400));
});
