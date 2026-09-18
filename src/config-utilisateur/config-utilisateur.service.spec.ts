import { BadRequestException } from '@nestjs/common';
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
  creeLe: maintenant,
  misAJourLe: maintenant,
  ...overrides,
});

describe('ConfigUtilisateurService', () => {
  let service: ConfigUtilisateurService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      configUtilisateur: { upsert: jest.fn() },
    };
    service = new ConfigUtilisateurService(prisma as PrismaService);
  });

  it('recupererOuCreer crée la config par défaut si absente', async () => {
    prisma.configUtilisateur.upsert.mockResolvedValue(makeConfig());
    const result = await service.recupererOuCreer('user-1');
    expect(prisma.configUtilisateur.upsert).toHaveBeenCalledWith({
      where: { idUtilisateur: 'user-1' },
      update: {},
      create: { idUtilisateur: 'user-1' },
    });
    expect(result).toEqual(
      expect.objectContaining({
        type: 'configUtilisateur',
        idUtilisateur: 'user-1',
        theme: 'sombre',
        vuLaDerniereFois: null,
      }),
    );
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
});
