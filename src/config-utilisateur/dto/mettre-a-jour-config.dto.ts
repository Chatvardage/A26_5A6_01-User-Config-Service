import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ enum: ['sombre', 'clair'] })
  @IsOptional()
  @IsIn(['sombre', 'clair'])
  theme?: 'sombre' | 'clair';

  @ApiPropertyOptional({ enum: ['fr', 'en'] })
  @IsOptional()
  @IsIn(['fr', 'en'])
  langue?: 'fr' | 'en';

  @ApiPropertyOptional({ enum: ['systeme', 'discret', 'aucune'] })
  @IsOptional()
  @IsIn(['systeme', 'discret', 'aucune'])
  modeNotification?: 'systeme' | 'discret' | 'aucune';
}
