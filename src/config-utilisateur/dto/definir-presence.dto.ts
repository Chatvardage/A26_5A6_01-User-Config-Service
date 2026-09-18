import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class DefinirPresenceDto {
  @ApiProperty({ enum: ['enLigne', 'horsLigne'] })
  @IsNotEmpty()
  @IsIn(['enLigne', 'horsLigne'])
  statut!: 'enLigne' | 'horsLigne';
}
