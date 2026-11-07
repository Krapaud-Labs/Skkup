# Backend Skkup

API NestJS de Skkup. Elle fournit les routes REST authentifiées, les règles
métier et les événements Socket.IO. PostgreSQL/Prisma conserve les données et
Redis prend en charge les traitements asynchrones.

## Installation et démarrage

Prérequis : Node.js compatible avec le projet, PostgreSQL et Redis. Configurez
`DATABASE_URL`, `REDIS_URL` et `JWT_SECRET`, puis lancez :

```bash
npm ci
npm run start:dev
```

## Tests et contrôles

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run typecheck
```

Les tests E2E démarrent l'application complète et nécessitent une base
PostgreSQL et Redis accessibles via `DATABASE_URL` et `REDIS_URL`. Le client
Prisma est régénéré avant les contrôles d'intégration lorsque le schéma évolue.
La configuration Jest E2E résout les imports TypeScript générés par Prisma et
fournit uniquement un secret JWT de test si aucun secret n'est défini.
La CI démarre PostgreSQL et Redis éphémères, puis appelle
`scripts/run-isolated-e2e-suite.sh` séparément pour chaque suite E2E protégée.
Le helper applique les migrations avant chaque suite et exige son identifiant
`E2E_SUITE` ainsi que son garde dédié, avec tous les autres gardes à `0`. Les
sept suites exécutées sont `announcements-lifecycle`, `auth-lifecycle`,
`extension-pairing`, `daily-checkin`, `raffle-admin-draw`,
`watch-session-heartbeat` et `scratch-card-no-win`. La CI n'utilise aucun secret
de production.

Le test HTTP ciblé `test/me-dashboard-viewer.e2e-spec.ts` signe ses jetons
avec la valeur initiale de `JWT_SECRET`, déjà capturée lors de l'import de
`AuthModule` par `MeModule`. Il ne réassigne donc pas cette variable dans
`beforeAll`; ainsi, la clé du jeton et celle du garde restent identiques en
local et en CI.

Le scénario `test/announcements-lifecycle.e2e-spec.ts` démarre le module HTTP
des annonces avec le vrai `PrismaService` et le vrai `AnnouncementsService`.
Il vérifie la visibilité Viewer et les événements d'audit après les mutations
du cycle. Il refuse de s'exécuter sans
`ANNOUNCEMENT_E2E_ALLOW_DATABASE=1`, sur un hôte autre que localhost ou le
service Postgres CI, ou sur une base dont le nom ne contient pas `test` ou
`qa`. Appliquer les migrations sur une base jetable avant de le lancer :

```bash
DATABASE_URL=postgresql://qa:qa@127.0.0.1:5432/skkup_qa \
  ANNOUNCEMENT_E2E_ALLOW_DATABASE=1 npm run test:e2e -- --runInBand \
  test/announcements-lifecycle.e2e-spec.ts
```

En CI, chaque appel au helper définit exactement le garde requis par la suite
sur la base dédiée `skuup_test`; les autres restent à `0`. En local, ne jamais
activer ces gardes pour une base de développement ou de production.

Pour exécuter une suite E2E backend autorisée dans une cible Docker isolée,
lancer depuis la racine du dépôt :

```bash
bash backend/scripts/test-isolated-e2e-docker.sh announcements-lifecycle
# Parcours HTTP/DB d'authentification
bash backend/scripts/test-isolated-e2e-docker.sh auth-lifecycle
# Appairage HTTP/DB de l'extension
bash backend/scripts/test-isolated-e2e-docker.sh extension-pairing
# Check-in quotidien HTTP/DB
bash backend/scripts/test-isolated-e2e-docker.sh daily-checkin
# Tirage administrateur HTTP/DB (US-006)
bash backend/scripts/test-isolated-e2e-docker.sh raffle-admin-draw
# Heartbeat authentifié de session de visionnage (US-004)
bash backend/scripts/test-isolated-e2e-docker.sh watch-session-heartbeat
# Grattage sans gain et activité HTTP/DB
bash backend/scripts/test-isolated-e2e-docker.sh scratch-card-no-win
```

Le runner n'accepte que les identifiants de suite `announcements-lifecycle`,
`auth-lifecycle`, `extension-pairing`, `daily-checkin`, `raffle-admin-draw`,
`watch-session-heartbeat` et `scratch-card-no-win`; il ne prend aucun chemin
de fichier fourni librement en argument. Il utilise un nom de projet unique
et ne charge
aucun fichier `.env`, n'expose aucun port, place les données PostgreSQL dans un
`tmpfs` et connecte les conteneurs à un réseau interne sans sortie. Il applique
toutes les migrations avant les tests HTTP de la suite sélectionnée, puis
supprime les conteneurs, le réseau et l'image locale construite, même si le test
échoue ou est interrompu. Le build de l'image peut nécessiter un accès réseau
pour télécharger des dépendances; l'isolation sans sortie s'applique aux
conteneurs en exécution.

Ces suites valident uniquement les parcours ciblés du cycle des annonces, de
l'auth HTTP/DB, de l'appairage de l'extension, du check-in quotidien et du tirage
administrateur HTTP/DB. Le scénario `raffle-admin-draw` requiert le seul garde
`RAFFLE_DRAW_E2E_ALLOW_DATABASE=1`, fourni par le runner au conteneur jetable.
Il exerce l'endpoint manuel avec PostgreSQL; il ne démarre pas le worker
automatique ni Redis/BullMQ et ne prouve pas l'entropie externe, la revue
humaine ou l'ensemble des critères US-001 à US-006. La CI n'a pas exécuté leurs
parcours intégrés.
Le scénario `watch-session-heartbeat` requiert le seul garde
`WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE=1`, fourni au conteneur jetable;
il couvre le parcours HTTP/DB de heartbeat, dont l'envoi concurrent du même
intervalle et la vérification qu'un seul crédit est inscrit. Il ne prouve pas
à lui seul tous les critères US-004.
Le scénario `daily-checkin` relit aussi `GET /me/points/history` après les
check-ins et compare les identifiants et montants exposés par HTTP au ledger
PostgreSQL synthétique.
Le scénario `raffle-admin-draw` inclut un scénario déterministe et test-only
qui retarde l'insertion d'un ticket dans la base jetable afin d'exercer la
course entre inscription et clôture du tirage. L'inscription verrouille la
ligne du tirage avant de vérifier son état et de créer le ticket; elle est
ainsi ordonnée avec la mise à jour de clôture et l'instantané des participants.
Le déclencheur de délai du scénario reste uniquement dans la base jetable et
n'ajoute aucun comportement au schéma produit.
Le scénario `scratch-card-no-win` requiert le seul garde
`SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE=1`, fourni au conteneur jetable; il
vérifie le grattage sans gain avec PostgreSQL et la transaction de montant zéro.

Une carte à gratter révélant « rien » crée une activité `CARTE_A_GRATTER` de
montant `0`. Cet enregistrement rend le résultat visible dans l'activité
récente sans créditer le solde ni émettre de notification de points. La mise à
jour de la carte et l'activité sont atomiques.

## Cycle des annonces

Les annonces suivent les états `DRAFT`, `PUBLISHED` et `ARCHIVED`. Les routes
de mutation restent protégées par `AdminGuard`:

- `POST /admin/announcements` crée toujours un brouillon masqué.
- `POST /admin/announcements/:id/publish` publie explicitement un brouillon.
- `DELETE /admin/announcements/:id` archive sans supprimer.
- `POST /admin/announcements/:id/restore/:eventId` restaure l'instantané d'un
  événement d'archive.

Les réponses d'administration exposent `status` et conservent `actif` comme
alias de compatibilité (`true` uniquement pour `PUBLISHED`). Le `PATCH` accepte
encore un ancien champ `actif` et le traduit en publication ou archivage; les
nouveaux clients doivent employer les actions explicites. Une édition archivée,
une publication d'un état autre que brouillon et une restauration d'un événement
qui n'est pas une archive renvoient `409`. Une publication ou un archivage
répétés sont idempotents sans événement d'audit supplémentaire. Les mutations
et leurs événements d'audit sont écrits dans une transaction.

La migration `20261023000000_announcement_lifecycle_and_kick` conserve toutes
les annonces: `actif=true` devient `PUBLISHED`, `actif=false` devient
`ARCHIVED`, sans republier les annonces masquées. Un trigger maintient l'alias
`actif` pour les anciennes instances et clients. Le rollback applicatif vers une
version qui ignore `status` continue de masquer les brouillons comme annonces
inactives; le retour complet à la distinction DRAFT/ARCHIVED requiert une
version qui lit `status`. La migration ne supprime ni données ni ancienne
colonne. L'énumération de plateforme ajoute aussi `KICK` sans modifier les
valeurs existantes.

## Annonces viewer

`GET /viewer/announcements` requiert un JWT valide et accepte les comptes
Viewer et Admin, afin que l’administrateur puisse aussi consulter son dashboard
viewer. La route conserve une limite de 60 requêtes par minute. Elle fournit les
annonces publiées (`status: PUBLISHED`), y compris celles dont la date de début
est future ou dont la date de fin est passée. Les brouillons et annonces
archivées sont exclues. La réponse est paginée par lots fixes de 50 éléments :
`{ items, nextCursor }`. Envoyer `nextCursor` dans le paramètre `cursor` pour
lire la page suivante; il vaut `null` à la dernière page. Le curseur opaque est
stable sur `createdAt` puis `id`; aucun total ni taille de page client n'est
accepté. Chaque élément expose le titre et le texte brut nécessaires au menu
Notifications; aucun suivi de lecture, compteur ou donnée personnalisée par
utilisateur n'est géré par cette route. Les appels sans JWT valide restent
refusés.
L'endpoint historique `GET /announcements/active` reste distinct et continue
de filtrer les annonces selon leur période courante.

## Notification de création d'un tirage

`POST /admin/raffles` utilise l'identifiant de l'administrateur authentifié
comme auteur des traces d'audit et de l'annonce. La transaction crée le tirage
et ses lots, crée un brouillon d'annonce, puis le publie et écrit les
événements `RAFFLE_CREATED`, `ANNOUNCEMENT_CREATED` et
`ANNOUNCEMENT_PUBLISHED`. Toute erreur avant le commit annule ensemble le
tirage, les lots, l'annonce et les audits.

Le titre de notification est borné à 160 caractères; le texte garde le titre
complet du tirage ainsi que la date prévue d'ouverture et la date prévue du
tirage, formatées selon le fuseau `Europe/Paris`. Il n'expose pas la graine de
l'organisateur ni les lots. L'annonce devient visible dans
`GET /viewer/announcements` dès le prochain chargement du centre de
notifications, même si sa date d'ouverture est future; l'endpoint public
`GET /announcements/active` respecte toujours la période de l'annonce.
L'événement temps réel `raffle:status` est émis vers les clients de la room des
tirages seulement après le commit. Si sa diffusion échoue, le tirage et
l'annonce persistés restent valides et disponibles au prochain chargement.

`POST /admin/raffles` ne possède pas de clé d'idempotence. Une répétition de
la requête crée un nouveau tirage et une nouvelle annonce, chacun atomiquement;
la garantie d'une seule paire par tentative logique demanderait une clé
d'idempotence ou une relation unique persistée.

## Modules administrateur

Les routes suivantes sont protégées par `AdminGuard` et la validation globale
des DTO :

- `GET/POST /admin/lots`, `GET/PATCH/DELETE /admin/lots/:id` : catalogue des
  lots, recherche, stock (`quantite`), fournisseur et sponsor. Les lots ne
  sont modifiables ou supprimables que tant que le tirage est ouvert et qu'ils
  n'ont pas de gagnant.
- `GET /admin/users?search=...`, `GET /admin/users/:id` : liste bornée et
  détail sans mot de passe ni secret.
- `PATCH /admin/users/:id/status` avec `{ "actif": boolean }` : activation
  ou désactivation. Une désactivation incrémente `sessionVersion` et invalide
  immédiatement les sessions existantes.

Les sessions web portées par cookie sont valables pour le jour de connexion
uniquement. Au changement de journée, l'ancien cookie est refusé et le
dashboard redirige vers `/connexion`; une nouvelle connexion est donc requise
avant l'enregistrement automatique de la visite quotidienne. Le jeton propre à
l'extension reste indépendant de cette règle.

- `GET /admin/users/:id/audit` : événements d'administration associés au
  compte.

Les changements de lots et de statut utilisateur sont enregistrés dans
`ContentAuditEvent`. Le champ `users.actif` est ajouté par la migration
`20261003000000_user_active_status`.

## Contrat cockpit admin V3

`GET /admin/dashboard/summary` est protégé par `AdminGuard`. Il fournit des
compteurs bornés pour les utilisateurs, tirages ouverts, contenus publiés,
annonces publiées, signalements ouverts et streams actifs, ainsi que les huit
dernières activités d'audit. Les agrégats sont exécutés en parallèle et les
sélections excluent les mots de passe, jetons et autres credentials.
Les lignes de tirages ouverts exposent aussi leur description contractuelle et
les annonces publiées leur texte, afin que le cockpit puisse conserver la
densité informative de la référence sans ajouter de contenu fictif.

## Contrat cockpit viewer V3

`GET /public/stats` retourne le nombre persistant d'utilisateurs inscrits.
La Gateway diffuse la même valeur via `users:count` sur la room publique
après chaque inscription et à la connexion d'un client. Le compteur ne
repose pas sur une fixture ou une valeur de démonstration.

`GET /me/dashboard/summary` est protégé par `JwtAuthGuard`. Tout compte connecté,
y compris un administrateur qui consulte aussi son espace personnel, peut lire
son propre résumé; l'identifiant provient exclusivement de la session et la
route ne donne accès à aucune donnée d'un autre compte. Elle renvoie un
agrégat limité à l'utilisateur authentifié : profil minimal, secondes de
visionnage validées, nombre de sessions, tickets de tirage, cartes à gratter
disponibles et toutes les activités des 168 dernières heures, sans plafond fixe
d'éléments. La fenêtre inclut sa frontière exacte, puis les éléments en sortent
après 168 heures. Des index composés par utilisateur et date soutiennent ces
lectures. Le temps de visionnage est agrégé depuis `WatchSession` côté API et
ne peut pas être fourni par le navigateur. Le tableau `transactionsRecentes`
inclut aussi les sessions validées récentes qui n'ont généré aucun point
(`WATCH_TIME`, montant `0` dans
ce résumé uniquement). Chaque session récente produit une seule activité avec
un ID stable `watch-session:<id>`, triée selon son dernier heartbeat. Son
montant est la somme de tous les crédits `WATCH_TIME` liés à cette session,
quel que soit l'âge des transactions `WATCH_TIME` liées. Les autres
types restent affichés transaction par transaction. Les transactions
`WATCH_TIME` historiques sans `watchSessionId` restent aussi des lignes
individuelles. Une session sans crédit lié affiche zéro uniquement dans ce
résumé; aucune ligne de ledger à zéro n'est créée et `soldePoints` ne change pas.

### Cartes à gratter en deux phases

`POST /me/scratch-cards/:id/prepare` réserve de façon idempotente le résultat
aléatoire d'une carte sans créditer les points ni créer de ticket. Le résultat
est transmis uniquement à l'appel de préparation; les lectures ordinaires de
`GET /me/scratch-cards` masquent les champs réservés tant que la carte n'est
pas validée. Une nouvelle préparation retourne le même résultat et ne permet
pas de relancer le tirage.

`POST /me/scratch-cards/:id/scratch` valide atomiquement la carte préparée,
crédite le gain ou le ticket, puis marque la carte comme utilisée. Les clients
qui appellent directement l'ancienne route sans préparation gardent le même
comportement en une requête. Le seuil visuel de 90 % est appliqué par
l'interface; les gains et leur attribution restent calculés et validés par
l'API. Si le tirage réservé n'est plus ouvert au moment de la validation, la
carte est convertie en points selon son palier.

## Fixture locale de recette DASH-V3

La commande `npm run qa:seed-dashboard-v3` prépare un tirage, un lot, une annonce,
onze signalements distincts, deux chaînes, trois cartes à gratter et deux contenus
éditoriaux explicitement préfixés `qa_dashv3_` pour la comparaison navigateur des
fiches admin. Les signalements utilisent des identifiants, types et dates
fixes : la fixture est idempotente et rend la pagination de modération
reproductible.
Elle est refusée par défaut, exige `DASHV3_QA_FIXTURE=1` et
`DASHV3_QA_ENVIRONMENT=qa|staging`, vérifie le compte admin QA
et refuse toujours `NODE_ENV=production`. Elle ne doit jamais être exécutée sur
une base de production et n'effectue aucune insertion SQL directe : elle passe
uniquement par Prisma. Pour `qa-dashv3-home`, elle réinitialise aussi
l'historique `ContentVersion` de la fixture et recrée la version 1 publiée,
afin que la restauration officielle par version reste testable après plusieurs
exécutions du seed.

### Données locales de densité

Les commandes suivantes ajoutent 50 comptes de démonstration et un volume
d'activités, de sessions, de cartes et de tickets pour tester les tableaux
chargés dans Docker :

```bash
LOCAL_DEMO_DATA=1 NODE_ENV=development npm run build
LOCAL_DEMO_DATA=1 npm run local:seed-demo
```

Les comptes utilisent des adresses `@local.skkup.fr` et ne remplacent jamais
les comptes existants. Le seed est idempotent, refusé en production et exige
un compte administrateur dans la base locale.
