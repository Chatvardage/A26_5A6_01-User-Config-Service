# AGENTS.md — Chatvardage User Config Service

Ce fichier contient les règles de travail pour tout agent IA ou développeur qui modifie ce dépôt.

## Contexte du projet

Ce dépôt est le **User-Config-Service** de Chatvardage pour le Contrôle 2 du cours `420-5A6-ST – A26`.

Architecture d'équipe :

- `Frontend` : Electron et ChatGateway réel.
- `Serveur-API` : API Gateway / point d'entrée unique.
- `Authentification` : utilisateurs, authentification et rôles.
- `Room-Service` : gestion et administration des salons.
- `Message-Service` : messages privés, historique et temps réel.
- `User-Config-Service` : alias, thème, langue, présence et préférences de notification. **Ce dépôt.**
- `Dashboard` : panneau d'administration / AdminJS.
- `Infra` : Docker Compose, PostgreSQL, Redis et orchestration globale.

Le User-Config-Service ne doit **pas** prendre en charge l'authentification, les salons, les messages ou le temps réel. Il persiste uniquement les préférences propres à chaque utilisateur.

## Stack

- Node.js 22
- NestJS 11
- TypeScript
- Prisma 6
- PostgreSQL 17
- Jest
- ESLint + Prettier
- Swagger / OpenAPI
- Docker / Docker Compose

## Responsabilités du User-Config-Service

Le service doit conserver la responsabilité de :

- lire la configuration d'un utilisateur (créée avec des valeurs par défaut si elle n'existe pas encore);
- mettre à jour l'alias, le thème, la langue et le mode de notification;
- définir le statut de présence (`enLigne` / `horsLigne`) et l'horodatage de dernière activité;
- persister ces préférences dans PostgreSQL, une ligne par utilisateur;
- exposer un healthcheck pour le service et PostgreSQL.

Ne pas déplacer ici les responsabilités des autres microservices. En particulier, ne pas gérer le pseudo/l'identité (propriété d'`Authentification`), ni les salons ou messages.

## Contrat avec le Gateway

Le service est destiné à être appelé derrière `Serveur-API`.

Le Gateway transmet l'identité déjà validée avec :

```http
x-user-id: <id utilisateur>
```

Ne jamais considérer cet en-tête comme sûr si le service devient directement exposé à Internet. Dans l'architecture finale, le User-Config-Service doit rester un service interne.

Toutes les routes sont sous `/api`. Swagger est exposé sous `/docs`.

## Contrat de données avec le Frontend

Le format retourné par l'API doit rester stable, sauf changement coordonné entre les dépôts :

```ts
{
  type: 'configUtilisateur',
  idUtilisateur: string,
  alias: string | null,
  theme: 'sombre' | 'clair',
  langue: 'fr' | 'en',
  statutPresence: 'enLigne' | 'horsLigne',
  vuLaDerniereFois: string | null,
  modeNotification: 'systeme' | 'discret' | 'aucune'
}
```

Ce format doit permettre de remplacer, côté Frontend, la simulation locale actuelle (`localStorage`, IPC Electron `theme:*`, `langue:*`, `presence:*`, `NotifPrefs`) par de vrais appels à ce service.

Les `idUtilisateur` restent des chaînes. Ne pas ajouter de table `User` ou de clé étrangère vers un utilisateur : les utilisateurs appartiennent au service d'authentification.

## Décisions de conception à préserver

### `vuLaDerniereFois` mis à jour même en passant `horsLigne`

Dans `ConfigUtilisateurService.definirPresence`, `vuLaDerniereFois` est réécrit à **chaque** appel, peu importe le `statut` fourni (`enLigne` ou `horsLigne`). Ceci est volontaire, pas un oubli :

- Ce champ représente « vu(e) pour la dernière fois », affiché côté Frontend uniquement quand `statutPresence` est `horsLigne` (convention WhatsApp/Messenger/Telegram).
- Il doit donc correspondre à l'instant de la **déconnexion**, pas à celui de la dernière connexion.
- Une correction qui ne mettrait à jour ce champ qu'en passant `enLigne` semble intuitive à première vue, mais casserait cette sémantique : un utilisateur resté connecté 3 heures puis déconnecté afficherait alors « vu(e) il y a 3 heures » juste après s'être déconnecté.

Ne pas « corriger » ce comportement sans revalider l'intention produit avec l'équipe.

## Base de données et Prisma

Schéma principal : `ConfigUtilisateur` (une ligne par utilisateur, clé primaire `idUtilisateur`).

Les migrations Prisma sont versionnées dans `prisma/migrations/`.

Après une modification de `prisma/schema.prisma` :

```bash
npx prisma generate
npx prisma migrate dev --name <nom_de_la_migration>
```

Ne jamais modifier une migration déjà appliquée pour masquer un changement. Créer une nouvelle migration.

Dans Docker/déploiement, utiliser :

```bash
npx prisma migrate deploy
```

## Commandes obligatoires avant de terminer une modification

Installer les dépendances de façon reproductible :

```bash
npm ci
```

Puis exécuter au minimum :

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Pour une modification importante de logique métier, exécuter aussi :

```bash
npm run test:cov
```

Pour vérifier le formatage :

```bash
npx prettier --check "src/**/*.ts" "test/**/*.ts"
```

`npm run format` modifie les fichiers; ne l'utiliser que lorsqu'un formatage automatique est souhaité.

Un agent ne doit pas annoncer que le travail est terminé si une de ces vérifications échoue. Il doit corriger l'erreur ou indiquer clairement ce qui bloque.

## Tests

Framework officiel de ce dépôt : **Jest**.

Lors d'un changement de comportement :

1. ajouter ou modifier les tests concernés;
2. couvrir le chemin nominal;
3. couvrir les cas d'erreur importants (identité manquante, DTO vide, etc.);
4. éviter les tests qui vérifient uniquement `toBeDefined()` lorsqu'un comportement peut être testé;
5. mocker `PrismaService` dans les tests unitaires plutôt que dépendre d'une vraie base de données.

Les tests E2E doivent refléter les routes actuelles du User-Config-Service.

## Langue du code

Ce dépôt est rédigé **entièrement en français** : identifiants (variables, méthodes, champs Prisma, routes), messages d'erreur, commentaires et documentation. Seuls les mots-clés du langage/framework (`Controller`, `Service`, `Module`, `class-validator`, etc.) restent en anglais, car ils font partie de NestJS/TypeScript.

## Lint, style et qualité

- Respecter ESLint et Prettier existants.
- Garder TypeScript typé; éviter `any` dans le code de production.
- Garder les contrôleurs minces : validation HTTP/headers et délégation au service.
- Garder la logique métier dans `ConfigUtilisateurService`.
- Garder l'accès aux données via Prisma.
- Valider les entrées avec les DTO et `class-validator`.
- Retourner des erreurs HTTP NestJS explicites (`BadRequestException`, `UnauthorizedException`, etc.).
- Ne pas laisser de code généré, mort ou de dépendances inutilisées.

## Docker

Pour tester ce dépôt seul :

```bash
docker compose -f compose.local.yml up --build
```

Le compose local doit lancer :

- User-Config-Service sur `3005`;
- PostgreSQL;
- les migrations Prisma au démarrage du service.

Healthcheck attendu :

```bash
curl http://localhost:3005/api/health
```

Le `compose.local.yml` sert au développement autonome. L'environnement final est orchestré par le dépôt `Infra`.

Ne pas ajouter Redis ou de WebSocket à ce service : la configuration utilisateur est consultée en REST classique, sans temps réel pour l'instant.

## Documentation

Toute modification d'une route, d'un DTO, d'une variable d'environnement, d'un port ou d'une procédure de lancement doit mettre à jour :

- Swagger/OpenAPI lorsque pertinent;
- `README.md`;
- `.env.example` lorsque pertinent;
- ce fichier `AGENTS.md` si les règles de développement changent.

Le README doit rester suffisant pour démarrer et tester le service sans connaissance implicite du projet.

## Avant une Pull Request

Vérifier :

- [ ] le changement reste dans la responsabilité du User-Config-Service;
- [ ] aucun secret ou `.env` réel n'est commité;
- [ ] les migrations Prisma nécessaires sont présentes;
- [ ] `npm run lint` passe;
- [ ] `npm test` passe;
- [ ] `npm run test:e2e` passe;
- [ ] `npm run build` passe;
- [ ] `npm run test:cov` a été vérifié pour les changements importants;
- [ ] Swagger et README sont à jour;
- [ ] le compose local fonctionne si Docker/DB ont été modifiés;
- [ ] les changements incompatibles avec Frontend/Serveur-API sont documentés.

Dans la description de PR, résumer les changements, indiquer les tests exécutés et signaler tout impact sur les autres dépôts.

## Couverture obligatoire

- `npm run test:cov` doit terminer avec 100 % Statements, Branches, Functions et Lines.
- Le seuil Jest global est fixé à 100 % : toute baisse fait échouer la commande.
- Toute nouvelle branche de logique doit être accompagnée de tests couvrant succès et erreurs.
- Avant une PR : `npm run lint`, `npm test`, `npm run test:cov`, `npm run test:e2e`, `npm run build`.
