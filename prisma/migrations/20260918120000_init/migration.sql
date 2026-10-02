CREATE TYPE "Theme" AS ENUM ('sombre', 'clair');

CREATE TYPE "Langue" AS ENUM ('fr', 'en');

CREATE TYPE "StatutPresence" AS ENUM ('enLigne', 'horsLigne');

CREATE TYPE "ModeNotification" AS ENUM ('systeme', 'discret', 'aucune');

CREATE TABLE "ConfigUtilisateur" (
    "idUtilisateur" TEXT NOT NULL,
    "alias" TEXT,
    "theme" "Theme" NOT NULL DEFAULT 'sombre',
    "langue" "Langue" NOT NULL DEFAULT 'fr',
    "statutPresence" "StatutPresence" NOT NULL DEFAULT 'horsLigne',
    "vuLaDerniereFois" TIMESTAMP(3),
    "modeNotification" "ModeNotification" NOT NULL DEFAULT 'systeme',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConfigUtilisateur_pkey" PRIMARY KEY ("idUtilisateur")
);
