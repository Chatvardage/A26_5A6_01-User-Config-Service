import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

export const EN_TETE_JETON_INTERNE = 'x-internal-token';

/**
 * Toutes les routes métier de ce service sont appelées par d'autres
 * microservices : Serveur-API (routes /api/config-utilisateur, avec
 * l'identité validée dans x-user-id) et Authentification (compte supprimé).
 * Sans ce secret partagé, n'importe quel processus capable de joindre le
 * port du service pouvait se faire passer pour n'importe qui avec
 * x-user-id. Échoue fermé : sans INTERNAL_SERVICE_TOKEN configuré, toute
 * requête est refusée. Même garde que Room-Service et Message-Service.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const attendu = process.env.INTERNAL_SERVICE_TOKEN?.trim();
    if (!attendu) {
      throw new ServiceUnavailableException(
        'INTERNAL_SERVICE_TOKEN non configuré',
      );
    }

    const recu = context.switchToHttp().getRequest<Request>().headers[
      EN_TETE_JETON_INTERNE
    ];
    const tampon = Buffer.from(typeof recu === 'string' ? recu : '');
    const tamponAttendu = Buffer.from(attendu);
    // Comparaison en temps constant (après égalité de longueur, requise par
    // timingSafeEqual).
    if (
      tampon.length !== tamponAttendu.length ||
      !timingSafeEqual(tampon, tamponAttendu)
    ) {
      throw new UnauthorizedException('Jeton interne invalide');
    }
    return true;
  }
}
