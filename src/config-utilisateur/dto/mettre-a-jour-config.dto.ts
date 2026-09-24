import { ApiPropertyOptional } from '@nestjs/swagger';
import { Langue, ModeNotification, Theme } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Taille maximale de l'avatar (data URL complète). Doit rester sous la
// limite JSON par défaut d'Express (100 Ko) avec le reste du corps : le
// Frontend redimensionne l'image à 256 px avant envoi (~20-60 Ko).
export const LONGUEUR_MAX_AVATAR = 90_000;

// data URL d'image matricielle uniquement (pas de SVG : il peut contenir du
// script), ou chaîne vide pour retirer l'avatar.
const FORMAT_AVATAR =
  /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})?$/;

// @ValidateIf(champ !== undefined) rejette explicitement null (400) tout en
// gardant le champ optionnel. Messages d'erreur par défaut de class-validator
// volontairement non personnalisés pour null : voir AGENTS.md.
export class MettreAJourConfigDto {
  @ApiPropertyOptional({
    example: 'Ariane',
    description:
      "Nom d'affichage choisi par l'utilisateur, distinct du pseudo du service d'authentification. Une valeur vide ou composée uniquement d'espaces efface l'alias.",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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

  @ApiPropertyOptional({
    example: 'data:image/webp;base64,UklGR…',
    description:
      "Image de profil en data URL base64 (PNG, JPEG ou WebP, 90 000 caractères max). Une chaîne vide retire l'avatar.",
  })
  @ValidateIf((objet: MettreAJourConfigDto) => objet.avatar !== undefined)
  @IsString()
  @MaxLength(LONGUEUR_MAX_AVATAR)
  @Matches(FORMAT_AVATAR, {
    message: 'avatar must be a PNG, JPEG or WebP base64 data URL',
  })
  avatar?: string;
}
