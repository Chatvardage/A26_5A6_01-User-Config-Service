import { ApiProperty } from '@nestjs/swagger';
import { StatutPresence } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class DefinirPresenceDto {
  @ApiProperty({ enum: StatutPresence })
  @IsEnum(StatutPresence)
  statut!: StatutPresence;
}
