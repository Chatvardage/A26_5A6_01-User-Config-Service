import { ApiPropertyOptional } from '@nestjs/swagger';
import { Langue, ModeNotification, Theme } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class MettreAJourConfigDto {
  @ApiPropertyOptional({
    example: 'Ariane',
    description:
      "Nom d'affichage choisi par l'utilisateur, distinct du pseudo du service d'authentification",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @ApiPropertyOptional({ enum: Theme })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ enum: Langue })
  @IsOptional()
  @IsEnum(Langue)
  langue?: Langue;

  @ApiPropertyOptional({ enum: ModeNotification })
  @IsOptional()
  @IsEnum(ModeNotification)
  modeNotification?: ModeNotification;
}
