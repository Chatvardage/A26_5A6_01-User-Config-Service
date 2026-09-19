import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// PrismaService est mocké (pas de vraie base) : convention officielle
// NestJS pour *.e2e-spec.ts (pipeline HTTP complète via supertest, avec
// providers remplacés). Voir AGENTS.md avant de renommer ce fichier.
describe('User Config Service (e2e)', () => {
  let app: INestApplication;
  const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  const findUnique = jest.fn().mockResolvedValue({
    idUtilisateur: 'user-1',
    alias: null,
    theme: 'sombre',
    langue: 'fr',
    statutPresence: 'horsLigne',
    vuLaDerniereFois: null,
    modeNotification: 'systeme',
    creeLe: new Date(),
    misAJourLe: new Date(),
  });
  const create = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      idUtilisateur: data.idUtilisateur,
      alias: null,
      theme: 'sombre',
      langue: 'fr',
      statutPresence: 'horsLigne',
      vuLaDerniereFois: null,
      modeNotification: 'systeme',
      creeLe: new Date(),
      misAJourLe: new Date(),
      ...data,
    }),
  );
  const upsert = jest.fn().mockImplementation(({ where, update }) =>
    Promise.resolve({
      idUtilisateur: where.idUtilisateur,
      alias: null,
      theme: 'sombre',
      langue: 'fr',
      statutPresence: 'horsLigne',
      vuLaDerniereFois: null,
      modeNotification: 'systeme',
      creeLe: new Date(),
      misAJourLe: new Date(),
      ...update,
    }),
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: queryRaw,
        configUtilisateur: {
          findUnique,
          create,
          upsert,
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

  it('GET /api/config-utilisateur crée la config au premier appel', async () => {
    findUnique.mockResolvedValueOnce(null);
    const response = await request(app.getHttpServer())
      .get('/api/config-utilisateur')
      .set('x-user-id', 'user-nouveau')
      .expect(200);
    expect(create).toHaveBeenCalledWith({
      data: { idUtilisateur: 'user-nouveau' },
    });
    expect(response.body).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-nouveau',
        theme: 'sombre',
      }),
    );
  });

  it('PATCH /api/config-utilisateur retourne 200 avec la config mise à jour', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/config-utilisateur')
      .set('x-user-id', 'user-1')
      .send({ theme: 'clair', langue: 'en' })
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        theme: 'clair',
        langue: 'en',
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

  it('PUT /api/config-utilisateur/presence retourne 200 avec le nouveau statut', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/config-utilisateur/presence')
      .set('x-user-id', 'user-1')
      .send({ statut: 'enLigne' })
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        statutPresence: 'enLigne',
      }),
    );
    expect(response.body.vuLaDerniereFois).not.toBeNull();
  });

  it('PUT /api/config-utilisateur/presence exige une identité authentifiée', () =>
    request(app.getHttpServer())
      .put('/api/config-utilisateur/presence')
      .send({ statut: 'enLigne' })
      .expect(401));

  it('PUT /api/config-utilisateur/presence rejette un statut inconnu', () =>
    request(app.getHttpServer())
      .put('/api/config-utilisateur/presence')
      .set('x-user-id', 'user-1')
      .send({ statut: 'absent' })
      .expect(400));
});
