import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User Config Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        configUtilisateur: {
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
});
