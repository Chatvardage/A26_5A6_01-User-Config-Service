import { ApiPropertyOptional } from '@nestjs/swagger';
import { Langue, ModeNotification, Theme } from '@prisma/client';
import { IsEnum, IsString, MaxLength, ValidateIf } from 'class-validator';

export class MettreAJourConfigDto {
  @ApiPropertyOptional({
    example: 'Ariane',
    description:
      "Nom d'affichage choisi par l'utilisateur, distinct du pseudo du service d'authentification",
  })
  @ValidateIf((objet: MettreAJourConfigDto) => objet.alias !== undefined)
  @IsString()
  @MaxLength(50)
  alias?: string;

  @ApiPropertyOptional({ enum: Theme })
  @ValidateIf((objet: MettreAJourConfigDto) => objet.theme !== undefined)
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ enum: Langue })
  @ValidateIf((objet: MettreAJourConfigDto) => objet.langue !== undefined)
  @IsEnum(Langue)
  langue?: Langue;

  @ApiPropertyOptional({ enum: ModeNotification })
  @ValidateIf(
    (objet: MettreAJourConfigDto) => objet.modeNotification !== undefined,
  )
  @IsEnum(ModeNotification)
  modeNotification?: ModeNotification;
}
