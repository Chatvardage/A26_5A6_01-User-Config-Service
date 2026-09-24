import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigUtilisateurService } from './config-utilisateur.service';

const maintenant = new Date('2026-09-18T12:00:00.000Z');

const makeConfig = (overrides: any = {}) => ({
  idUtilisateur: 'user-1',
  alias: null,
  theme: 'sombre' as const,
  langue: 'fr' as const,
  statutPresence: 'horsLigne' as const,
  vuLaDerniereFois: null,
  modeNotification: 'systeme' as const,
  avatar: null,
  creeLe: maintenant,
  misAJourLe: maintenant,
  ...overrides,
});

describe('ConfigUtilisateurService', () => {
  let service: ConfigUtilisateurService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      configUtilisateur: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ConfigUtilisateurService(prisma as PrismaService);
  });

  it('recupererOuCreer retourne la config existante sans écrire en base', async () => {
    prisma.configUtilisateur.findUnique.mockResolvedValue(makeConfig());
    const result = await service.recupererOuCreer('user-1');
    expect(prisma.configUtilisateur.findUnique).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
    });
    expect(prisma.configUtilisateur.create).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        theme: 'sombre',
        vuLaDerniereFois: null,
      }),
    );
  });

  it('recupererOuCreer crée la config par défaut si absente', async () => {
    prisma.configUtilisateur.findUnique.mockResolvedValue(null);
    prisma.configUtilisateur.create.mockResolvedValue(makeConfig());
    const result = await service.recupererOuCreer('user-1');
    expect(prisma.configUtilisateur.create).toHaveBeenCalledWith({
      data: { idUtilisateur: 'user-1' },
    });
    expect(result).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        theme: 'sombre',
      }),
    );
  });

  it('recupererOuCreer relit la config si une requête concurrente l’a créée en premier', async () => {
    prisma.configUtilisateur.findUnique.mockResolvedValue(null);
    prisma.configUtilisateur.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('conflit', {
        code: 'P2002',
        clientVersion: '6.16.0',
      }),
    );
    prisma.configUtilisateur.findUniqueOrThrow.mockResolvedValue(makeConfig());

    const result = await service.recupererOuCreer('user-1');

    expect(prisma.configUtilisateur.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
    });
    expect(result.idUtilisateur).toBe('user-1');
  });

  it('recupererOuCreer relance toute autre erreur de création', async () => {
    prisma.configUtilisateur.findUnique.mockResolvedValue(null);
    const erreurInattendue = new Error('panne de connexion');
    prisma.configUtilisateur.create.mockRejectedValue(erreurInattendue);

    await expect(service.recupererOuCreer('user-1')).rejects.toBe(
      erreurInattendue,
    );
    expect(prisma.configUtilisateur.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('mettreAJour refuse un DTO vide', async () => {
    await expect(service.mettreAJour('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.configUtilisateur.upsert).not.toHaveBeenCalled();
  });

  it('mettreAJour trim un alias fourni', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(
      makeConfig({ alias: 'Ariane' }),
    );
    await service.mettreAJour('user-1', { alias: '  Ariane  ' });
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: { alias: 'Ariane' },
      create: { idUtilisateur: 'user-1', alias: 'Ariane' },
    });
  });

  it('mettreAJour enregistre un avatar et le renvoie', async () => {
    const avatar = 'data:image/png;base64,AAAA';
    prisma.configUtilisateur.upsert.mockResolvedValue(makeConfig({ avatar }));
    const result = await service.mettreAJour('user-1', { avatar });
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: { avatar },
      create: { idUtilisateur: 'user-1', avatar },
    });
    expect(result.avatar).toBe(avatar);
  });

  it('mettreAJour transforme un avatar vide en null (retrait)', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(makeConfig());
    await service.mettreAJour('user-1', { avatar: '' });
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: { avatar: null },
      create: { idUtilisateur: 'user-1', avatar: null },
    });
  });

  it('mettreAJour transforme un alias vide en null', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(makeConfig());
    await service.mettreAJour('user-1', { alias: '   ' });
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: { alias: null },
      create: { idUtilisateur: 'user-1', alias: null },
    });
  });

  it('mettreAJour applique thème, langue et mode de notification', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(
      makeConfig({
        theme: 'clair',
        langue: 'en',
        modeNotification: 'discret',
      }),
    );
    const result = await service.mettreAJour('user-1', {
      theme: 'clair',
      langue: 'en',
      modeNotification: 'discret',
    });
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: { theme: 'clair', langue: 'en', modeNotification: 'discret' },
      create: {
        idUtilisateur: 'user-1',
        theme: 'clair',
        langue: 'en',
        modeNotification: 'discret',
      },
    });
    expect(result.theme).toBe('clair');
    expect(result.langue).toBe('en');
    expect(result.modeNotification).toBe('discret');
  });

  it('definirPresence met à jour le statut et vuLaDerniereFois', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(
      makeConfig({ statutPresence: 'enLigne', vuLaDerniereFois: maintenant }),
    );
    const result = await service.definirPresence('user-1', 'enLigne');
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idUtilisateur: 'user-1' },
        update: expect.objectContaining({ statutPresence: 'enLigne' }),
        create: expect.objectContaining({ statutPresence: 'enLigne' }),
      }),
    );
    expect(result.statutPresence).toBe('enLigne');
    expect(result.vuLaDerniereFois).toBe(maintenant.toISOString());
  });

  describe('listerProfilsPublics', () => {
    const il_y_a = (ms: number) => new Date(maintenant.getTime() - ms);

    it('ne sélectionne que les champs publics, avec avatar par défaut', async () => {
      prisma.configUtilisateur.findMany.mockResolvedValue([]);
      await service.listerProfilsPublics(['a', 'b'], true, maintenant);
      expect(prisma.configUtilisateur.findMany).toHaveBeenCalledWith({
        where: { idUtilisateur: { in: ['a', 'b'] } },
        select: {
          idUtilisateur: true,
          alias: true,
          avatar: true,
          statutPresence: true,
          vuLaDerniereFois: true,
        },
      });
    });

    it("inclut l'avatar et calcule la présence à l'instant présent par défaut", async () => {
      prisma.configUtilisateur.findMany.mockResolvedValue([
        makeConfig({
          idUtilisateur: 'a',
          statutPresence: 'enLigne',
          vuLaDerniereFois: new Date(),
        }),
      ]);
      const [profil] = await service.listerProfilsPublics(['a']);
      expect(
        prisma.configUtilisateur.findMany.mock.calls[0][0].select.avatar,
      ).toBe(true);
      expect(profil).toHaveProperty('avatar');
      expect(profil.actif).toBe(true);
    });

    it("omet l'avatar si inclureAvatar=false", async () => {
      prisma.configUtilisateur.findMany.mockResolvedValue([
        makeConfig({ idUtilisateur: 'a' }),
      ]);
      const [profil] = await service.listerProfilsPublics(
        ['a'],
        false,
        maintenant,
      );
      expect(
        prisma.configUtilisateur.findMany.mock.calls[0][0].select.avatar,
      ).toBe(false);
      expect(profil).not.toHaveProperty('avatar');
      expect(profil).not.toHaveProperty('theme');
    });

    it.each([
      ['enLigne récent', 'enLigne', il_y_a(30_000), true],
      ['enLigne à la limite', 'enLigne', il_y_a(90_000), true],
      ['enLigne périmé (app fermée)', 'enLigne', il_y_a(91_000), false],
      ['enLigne jamais vu', 'enLigne', null, false],
      ['horsLigne récent', 'horsLigne', il_y_a(1_000), false],
    ])(
      'actif : %s',
      async (_cas, statutPresence, vuLaDerniereFois, attendu) => {
        prisma.configUtilisateur.findMany.mockResolvedValue([
          makeConfig({ idUtilisateur: 'a', statutPresence, vuLaDerniereFois }),
        ]);
        const [profil] = await service.listerProfilsPublics(
          ['a'],
          true,
          maintenant,
        );
        expect(profil.actif).toBe(attendu);
      },
    );

    it('renvoie alias, avatar et type profilPublic', async () => {
      prisma.configUtilisateur.findMany.mockResolvedValue([
        makeConfig({
          idUtilisateur: 'a',
          alias: 'Bob',
          avatar: 'data:image/png;base64,AA',
        }),
      ]);
      expect(
        await service.listerProfilsPublics(['a'], true, maintenant),
      ).toEqual([
        {
          type: 'profilPublic',
          idUtilisateur: 'a',
          alias: 'Bob',
          avatar: 'data:image/png;base64,AA',
          statutPresence: 'horsLigne',
          vuLaDerniereFois: null,
          actif: false,
        },
      ]);
    });
  });
});
