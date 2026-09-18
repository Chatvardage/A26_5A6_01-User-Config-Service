import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Santé')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Vérifie la santé du service et de PostgreSQL' })
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'erreur',
        service: 'user-config-service',
        database: 'erreur',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      service: 'user-config-service',
      database: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
