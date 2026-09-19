import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
describe('HealthController', () => {
  it('retourne ok après requête DB', async () => {
    const prisma: any = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const result = await new HealthController(prisma).health();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'user-config-service',
        database: 'ok',
      }),
    );
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('renvoie une 503 structurée si la base est injoignable', async () => {
    const erreur = new Error('connexion refusée');
    const prisma: any = {
      $queryRaw: jest.fn().mockRejectedValue(erreur),
    };
    const journalErreur = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const controller = new HealthController(prisma);
    const resultat = controller.health();

    await expect(resultat).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(resultat).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 'erreur',
        service: 'user-config-service',
        database: 'erreur',
      }),
    });
    expect(journalErreur).toHaveBeenCalledWith(erreur);
  });
});
