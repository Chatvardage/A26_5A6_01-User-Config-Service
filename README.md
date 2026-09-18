# Chatvardage — User Config Service

Microservice de configuration utilisateur pour le **Contrôle 2 — Backend conteneurisé et services temps réel** du cours 420-5A6-ST.

Ce dépôt contient uniquement le service responsable des préférences personnelles de chaque utilisateur : alias, thème, langue, statut de présence et mode de notification. L'authentification, les salons et les messages ne sont pas gérés par ce service.

## Technologies

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- Swagger / OpenAPI
- Docker

## Responsabilités

Le service permet de :

- récupérer la configuration de l'utilisateur connecté (créée automatiquement avec des valeurs par défaut si elle n'existe pas encore);
- mettre à jour l'alias, le thème, la langue et le mode de notification;
- définir le statut de présence (en ligne / hors ligne) et l'horodatage de dernière activité;
- conserver ces préférences dans PostgreSQL, une ligne par utilisateur.

Le modèle retourné par l'API est pensé pour remplacer la simulation locale actuelle du client Electron (thème et langue en mémoire dans le process principal, présence simulée par le `MockGateway`, préférences de notification en `localStorage`) :

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

## Authentification entre services

L'authentification est effectuée par le service **Authentification** et l'API Gateway.

Le User-Config-Service reçoit l'identité déjà validée dans l'en-tête interne :

```http
x-user-id: <id utilisateur>
```

En production, ce service ne doit pas être exposé directement à Internet. Cet en-tête doit être ajouté par l'API Gateway après validation du JWT.

## Routes

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/config-utilisateur` | Récupère la configuration de l'utilisateur connecté (créée avec des valeurs par défaut si absente) |
| PATCH | `/api/config-utilisateur` | Met à jour l'alias, le thème, la langue ou le mode de notification |
| PUT | `/api/config-utilisateur/presence` | Définit le statut de présence de l'utilisateur connecté |
| GET | `/api/health` | Vérifie le service et PostgreSQL |

## Installation locale

Prérequis : Node.js 22, et un PostgreSQL accessible sur `localhost:5432` (via Docker, voir plus bas).

`npx prisma migrate deploy` se connecte réellement à une base de données : il faut donc qu'un PostgreSQL tourne déjà **avec les identifiants attendus par `.env`** avant de le lancer. Deux façons d'obtenir ce PostgreSQL, à ne pas mélanger :

### Option A — PostgreSQL du dépôt `Infra` (recommandé)

C'est la base déjà provisionnée avec les vrais identifiants du service (`config_service` / `chatvardage_config`), celle utilisée par l'environnement d'équipe.

```bash
cd ../A26_5A6_01-Infra
docker compose up -d postgres
cd ../A26_5A6_01-User-Config-Service

npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

`.env.example` pointe déjà vers `postgresql://config_service:config_service_dev@localhost:5432/chatvardage_config` : ne pas modifier ces identifiants dans ce scénario, ils correspondent à ceux créés par `Infra`.

### Option B — PostgreSQL autonome (`compose.local.yml`)

Pour tester ce dépôt sans dépendre d'`Infra`, voir la section suivante. Ce PostgreSQL utilise des identifiants génériques différents (`chatvardage` / `chatvardage`) : si on l'utilise, `.env` doit être ajusté en conséquence (ou lancer directement `docker compose -f compose.local.yml up --build`, qui définit `DATABASE_URL` lui-même sans passer par `.env`).

**Erreur `P1001: Can't reach database server at localhost:5432`** : aucun PostgreSQL ne tourne encore (ou celui qui tourne n'a pas les mêmes identifiants que `.env`). Démarrer l'option A ou B ci-dessus avant de relancer `npx prisma migrate deploy`.

Le service écoute par défaut sur :

```text
http://localhost:3005
```

Swagger est disponible sur :

```text
http://localhost:3005/docs
```

## Lancement avec Docker pour tester ce dépôt seul

Le fichier `compose.local.yml` permet de tester le microservice indépendamment de l'infrastructure globale, avec son propre PostgreSQL jetable (identifiants génériques `chatvardage` / `chatvardage`, distincts de ceux d'`Infra`) :

```bash
docker compose -f compose.local.yml up --build
```

Il démarre :

- `user-config-service` sur le port `3005`;
- PostgreSQL sur le port `5432`.

Ne pas lancer ce PostgreSQL en même temps que celui d'`Infra` : les deux écoutent sur le port `5432` et entreraient en conflit.

Dans l'environnement final de l'équipe, ce service doit plutôt être référencé depuis le `docker-compose.yml` global du dépôt `Infra`, avec les autres microservices.

## Variables d'environnement

```env
PORT=3005
DATABASE_URL="postgresql://config_service:config_service_dev@localhost:5432/chatvardage_config?schema=public"
```

## Exemple — récupérer sa configuration

```bash
curl http://localhost:3005/api/config-utilisateur \
  -H "x-user-id: user-1"
```

Réponse (créée avec des valeurs par défaut au premier appel) :

```json
{
  "type": "configUtilisateur",
  "idUtilisateur": "user-1",
  "alias": null,
  "theme": "sombre",
  "langue": "fr",
  "statutPresence": "horsLigne",
  "vuLaDerniereFois": null,
  "modeNotification": "systeme"
}
```

## Exemple — modifier le thème et la langue

```bash
curl -X PATCH http://localhost:3005/api/config-utilisateur \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{"theme":"clair","langue":"en"}'
```

## Exemple — mettre à jour la présence

```bash
curl -X PUT http://localhost:3005/api/config-utilisateur/presence \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{"statut":"enLigne"}'
```

## Base de données

Le service possède un seul modèle, une ligne par utilisateur :

```text
ConfigUtilisateur
├── idUtilisateur    (clé primaire, chaîne)
├── alias            (optionnel)
├── theme            (sombre | clair, défaut sombre)
├── langue           (fr | en, défaut fr)
├── statutPresence   (enLigne | horsLigne, défaut horsLigne)
├── vuLaDerniereFois (horodatage, optionnel)
├── modeNotification (systeme | discret | aucune, défaut systeme)
├── creeLe
└── misAJourLe
```

L'identifiant utilisateur est conservé sous forme de chaîne plutôt que comme clé étrangère vers `User`, car le modèle utilisateur appartient au service Authentification.

## Migration Prisma

Pour créer une nouvelle migration pendant le développement :

```bash
npx prisma migrate dev --name nom_de_la_migration
```

Dans Docker ou en déploiement :

```bash
npx prisma migrate deploy
```

## Healthcheck

```bash
curl http://localhost:3005/api/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "service": "user-config-service",
  "database": "ok",
  "timestamp": "..."
}
```

## Intégration avec Chatvardage

Ce service remplace, côté serveur, ce que le client Electron simule aujourd'hui localement :

- le thème (`theme-browser.js`, canaux IPC `theme:*`), actuellement en mémoire dans le process principal;
- la langue (`i18n/i18n-web.ts`, canaux IPC `langue:*`), actuellement en mémoire dans le process principal;
- la présence (`domain/entities/Presence.ts`), actuellement simulée par le `MockGateway`;
- les préférences de notification (`notif-prefs.js`), actuellement en `localStorage` par utilisateur simulé.

## Place du service dans l'architecture du Contrôle 2

Le projet d'équipe est séparé en responsabilités :

```text
Frontend Electron
      |
      v
Serveur-API (Gateway)
      |
      +--> Authentification
      +--> Room-Service
      +--> Message-Service
      +--> User-Config-Service   <-- ce dépôt

Dashboard Admin --> Serveur-API

Infra --> Docker Compose + PostgreSQL + Redis + configuration globale
```

Le **User-Config-Service ne gère volontairement ni l'authentification, ni les salons, ni les messages, ni le temps réel**. Il reste un service de préférences interrogé en REST classique.

## Vérifications avant remise

À partir d'un clone propre du dépôt :

```bash
docker compose -f compose.local.yml up --build
curl http://localhost:3005/api/health
```

Puis, pour vérifier le code hors Docker :

```bash
npm ci
npx prisma generate
npm run build
npm test
npm run test:e2e
npm run lint
```

Le `docker-compose.yml` global du dépôt `Infra` demeure le point de démarrage de l'environnement complet de l'équipe pour la démonstration du Contrôle 2.
