import { ServiceUnavailableException } from '@nestjs/common';
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
    const prisma: any = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connexion refusée')),
    };
    const controller = new HealthController(prisma);
    await expect(controller.health()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(controller.health()).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 'erreur',
        service: 'user-config-service',
        database: 'erreur',
      }),
    });
  });
});
