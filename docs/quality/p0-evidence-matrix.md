---
last_updated: 2026-10-30
owner: Mickael MUR
---

# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuves existantes et rattachement précis | Reste non prouvé / limite de portée | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | Campagne historique archivée du 2026-10-08. **Playwright Docker après le patch FAQ du 2026-10-28** : image frontend reconstruite sans cache depuis le checkout à HEAD `87e976380a686827b155ad5bb44b7f66844cbf91`, digest `sha256:4583fb7c0dc4a477ba3a73db9886df392f7d0ed73d4ce5dd602238b81d470785`; runner Playwright `v1.63.0`. Les quatre specs vitrine/FAQ/confidentialité/règlement ont d'abord produit 24/30 PASS; six échecs d'assertion du locator Accueil règlement (logo + lien texte ambigus) ont été corrigés en supprimant le retour Accueil redondant et en scoppant le test au header, puis les deux specs touchées `homepage-destinations` et `reglement-public-responsive` ont repassé 10/10 sur les projets desktop/mobile. Probe Playwright séparé: clic FAQ réussi depuis vitrine et règlement à 1280×900, 768×1024 et 390×844 (6/6); `/faq` et son titre visibles. Captures, logs, empreinte et diagnostics: `.codex/reports/agents/mvp_qa_gap.md` et artefacts `.codex/reports/agents/us001-qa-20261028-final-*`. | Couverture navigateur et liens vérifiés avec stubs API/fallback, sans backend réel. Zéro débordement/erreur JavaScript/requête externe dans le probe; six avertissements COOP dus à HTTP interne et neuf requêtes RSC préchargées annulées par le clic. Le contenu légal affiché est fallback ou fixture, jamais une relecture juridique/éditoriale ni preuve de contenu publié actuel. US-001 reste `needs-review`. | needs-review |
| US-002 | FLOW-001, API-001 | Campagne archivée du 2026-10-08 : `auth.service.spec.ts` et `auth.controller.spec.ts` figurent dans le rapport backend brut [`p0-live-2026-10-08/backend-jest-report.json`](evidence/p0-live-2026-10-08/backend-jest-report.json). Runs unitaires du 2026-10-18 conservés comme historiques. **E2E actuel du 2026-10-28** : `bash backend/scripts/test-isolated-e2e-docker.sh auth-lifecycle`; huit migrations appliquées et `backend/test/auth-lifecycle.e2e-spec.ts` réussi, 1/1. Le parcours HTTP/PostgreSQL couvre état anonyme, inscription, cookie HttpOnly/Secure/SameSite=Lax, session persistée, absence de JWT dans la réponse, mot de passe haché, login, logout, incrément de `sessionVersion` et refus de l'ancienne session; l'identité synthétique `example.test` est supprimée et le teardown retire conteneurs, réseau, image et données tmpfs. | E2E technique borné à l'auth/session. Ne prouve ni preuve d'âge/consentements ni décision juridique, l'ensemble des erreurs métier ou la clôture des exigences ACT-03/05. Les runs unitaires historiques ne remplacent pas cette preuve et les tests ne constituent pas une validation de conformité. | needs-review |
| US-003 | FLOW-001, API-002 | E2E HTTP/PostgreSQL `bash backend/scripts/test-isolated-e2e-docker.sh extension-pairing`: 8/8 migrations et 1/1 suite PASS, génération de code, échange unique, révocation, plafond cinq appareils. E2E navigateur `bash extension/scripts/test-e2e-browser-docker.sh`: une séquence Chromium MV3, 21 assertions, exit 0; vraie popup, `chrome.storage.local` après reload, rejeu 401, credential 201 puis 401 après révocation, dissociation locale. Log SHA-256 `5ff1e6721b55fab55c91822930d80a02c2525b963e78e13653a376ff0c8e50de`; rapport QA `.codex/reports/agents/us003_qa_browser_20261028.md`. | L’E2E HTTP/DB utilise un JWT viewer signé par la fixture; le run Chromium crée un compte synthétique par HTTP et utilise son cookie pour obtenir le code. Aucun test ne saisit le code depuis l’interface Next. Chromium charge une extension non empaquetée avec une clé publique injectée seulement dans le `dist/` jetable; aucune preuve Chrome Web Store ou production. Notifications Realtime mockées et délai d’expiration non attendu en temps réel. US-003 reste `needs-review`. | needs-review |
| US-004 | FLOW-001, API-002 | E2E isolé `bash backend/scripts/test-isolated-e2e-docker.sh watch-session-heartbeat`: 8/8 migrations, 1 suite / 2 tests PASS sur le service final. Couvre le credential d’extension, le heartbeat HTTP/DB, le crédit 64→65 puis aucun crédit supplémentaire au-delà du plafond, et deux requêtes parallèles avec une transaction; somme des crédits des réponses égale au ledger et au solde. Run final `skkup-e2e-watch-session-heartbeat-20261028160757-91117-165`; log [`us004-watch-session-heartbeat.log`](evidence/p0-http-postgres-2026-10-28/us004-watch-session-heartbeat.log), SHA-256 `af460d4a375ecd6ecb90017f85c7d014022daef074979f74d601a5f3f9670d5e`; spec [`watch-session-heartbeat.e2e-spec.ts`](../../backend/test/watch-session-heartbeat.e2e-spec.ts), SHA-256 `41fbca469f85c3f5654d3dee87b6b7f34550852b85418d49aa37ef310a59372a`. Le SHA complet du checkout au lancement n’a pas été capturé. | `Promise.all` ne force pas le chevauchement des sections transactionnelles et ne prouve pas une idempotence exhaustive. Pause, intervalle invalide/rejeu temporel, Redis/BullMQ et UI navigateur restent hors de ce scénario. Notifications Realtime mockées. US-004 reste `needs-review`. | needs-review |
| US-005 | FLOW-001, API-004 | E2E isolé `bash backend/scripts/test-isolated-e2e-docker.sh daily-checkin`: 8/8 migrations, 1 suite / 1 test PASS sur le service final. Paliers 3/7/14/30, rejeu même jour, reset, cartes conservées, solde/ledger, et `GET /me/points/history` comparé par IDs et montants au ledger DB. Run `skkup-e2e-daily-checkin-20261028160840-92043-30788`, log SHA-256 `0edbcff18dc67a10470ed5be54b2142ac8118d15c89466f530fa17904c4f3f16`. | Identité et dates synthétiques, notifications Realtime mockées; pas d’interface navigateur raccordée. Les types et montants de récompense restent non définis par le cahier accepté. US-005 reste `needs-review`. | needs-review |
| US-006 | FLOW-002, API-003 | E2E isolé `bash backend/scripts/test-isolated-e2e-docker.sh raffle-admin-draw`: le run initial a reproduit HTTP 201 et un ticket créé après un tirage figé à zéro (`e95ae310...`). Le correctif verrouille la même ligne `raffles` avant la relecture de l’éligibilité. Un run intermédiaire a ensuite échoué (2/3); le run final a passé 8/8 migrations et 3/3 tests, avec inscription/tirage cohérents, nombre, liste publique et empreinte concordants. Run final `skkup-e2e-raffle-admin-draw-20261028160702-90087-31077`; log [`us006-raffle-admin-draw.log`](evidence/p0-http-postgres-2026-10-28/us006-raffle-admin-draw.log), SHA-256 `36d3a3d97b809e9f4481e9a33692f5291ca5cb9a3d7a710bf6f954b8c996a30f`; spec [`raffle-admin-draw.e2e-spec.ts`](../../backend/test/raffle-admin-draw.e2e-spec.ts), SHA-256 `d3b0f8e06c9b2a92591f78ba60fcc3a036da28e2ad28260d916b898a983f609e`. Le SHA complet du checkout au lancement n’a pas été capturé. | Le test force inscription d’abord et ne force pas l’ordre inverse pendant un tirage déjà verrouillé. Aucun snapshot immuable d’IDs n’est conservé; CSPRNG est exercé via la fonction worker/service, pas le processus worker déployé. Pas de parcours UI ni décision juridique/conformité. US-006 reste `needs-review`. | needs-review |

## Relance unitaire ciblée P0 — 23 octobre 2026

Le rapport QA de cette relance est conservé hors du dépôt à
`/private/tmp/skkup-p0-unit-rerun-2026-10-23.md`. Le run frais a ciblé le code
`4a4861d3275b0b281b53656b7b7f13aa5345d921` sur `dev`, égal à `origin/dev` au
début et à la fin. Résultat total : **221/221 tests passés**, 0 échec et 0
ignoré (frontend web 9 fichiers/60 tests, extension 1 fichier/6 tests,
backend 15 suites/155 tests).

| Story | Suites exactes exécutées | Résultat frais |
| --- | --- | --- |
| US-001 | `frontend/src/app/page.test.tsx`; `frontend/src/components/legal/ReglementPublicContent.test.tsx` | 2 fichiers, 3 tests passés |
| US-002 | `frontend/src/components/auth/FormulaireAuth.test.tsx`; `backend/src/auth/dto/register.dto.spec.ts`, `backend/src/auth/auth.service.spec.ts`, `backend/src/auth/auth.password.spec.ts`, `backend/src/auth/auth.controller.spec.ts` | Frontend 11; backend 4 suites/20; total 31 tests passés |
| US-003 | `frontend/src/components/extension/CodeAppariement.test.tsx`; `extension/src/popup/code-appariement.test.ts`; `backend/src/extension/extension.service.spec.ts`, `backend/src/extension/extension-auth.guard.spec.ts`, `backend/src/extension/jetons-extension.spec.ts` | Frontend 10; extension 6; backend 3 suites/32; total 48 tests passés |
| US-004 | `frontend/src/lib/watch-sessions.test.ts`, `frontend/src/hooks/useSessionVisionnage.test.tsx`; `backend/src/watch-sessions/watch-sessions.service.spec.ts`, `backend/src/watch-sessions/watch-session-credential.guard.spec.ts` | Frontend 2 fichiers/8; backend 2 suites/27; total 35 tests passés |
| US-005 | `frontend/src/components/dashboard/HistoriquePointsViewer.test.tsx`; `backend/src/me/me.controller.spec.ts`, `backend/src/me/me.service.spec.ts` | Frontend 4; backend 2 suites/25; total 29 tests passés |
| US-006 | `frontend/src/components/admin/RafflesAdminV3.test.tsx`, `frontend/src/components/raffles/ListeTirages.test.tsx`; `backend/src/raffles/raffles.controller.spec.ts`, `backend/src/raffles/raffles.service.spec.ts`, `backend/src/raffles/raffle-draw.spec.ts`, `backend/src/raffles/tirage.spec.ts` | Frontend 24; backend 4 suites/51; total 75 tests passés |

Commandes Vitest : `./node_modules/.bin/vitest run <fichiers>` depuis
`frontend/` ou `extension/`. Commandes Jest : `npm test -- --runInBand <fichiers>`
depuis `backend/`. Environnement : Node 26.10.0, npm 11.19.1, Vitest 4.1.11,
Jest 30.4.1. Ces résultats sont strictement unitaires (Vitest/jsdom et doubles
de test inclus); ils n'établissent ni parcours HTTP, navigateur, Docker,
PostgreSQL, Redis/BullMQ, persistance, production, conformité ni acceptation
métier.

La revue de faisabilité backend du 2026-10-23 (`/private/tmp/skkup-p0-backend-integration-2026-10-23.md`, SHA historique) n'avait trouvé aucune suite HTTP/DB P0 pour US-001..US-006 et n'avait lancé aucun test, faute de cible DB isolée prouvée. Ce constat est conservé comme snapshot daté; depuis, des runners isolés ont ajouté des preuves ciblées pour US-002..US-006, et une campagne navigateur isolée US-001. Les suites unitaires ci-dessus gardent leur portée propre et ne sont pas remplacées par les nouvelles preuves.

## Reprise E2E HTTP/PostgreSQL isolée — 28 octobre 2026

Les runners Compose officiels ont des preuves HTTP/PostgreSQL ciblées pour US-002 (auth/session), US-003 (appariement extension), US-004 (heartbeat valide et plafond), US-005 (check-in/streak) et US-006 (tirage manuel et chemin CSPRNG worker/service): une suite chacun, huit migrations appliquées. US-004 a 2/2 tests PASS; US-006 a 3/3 après ajout de la course inscription/clôture; les détails et teardowns sont consignés dans les rapports QA dédiés. Pour ces runs, le QA a confirmé la suppression des conteneurs, du réseau isolé et des images dédiées. Pour US-006, le résultat du chemin CSPRNG et la liste sont relus via HTTP public, mais le générateur n'est pas appelé par HTTP ni par le processus worker déployé. Les suites US-003..US-006 ont aussi un lint ciblé Docker PASS. La cible backend utilise PostgreSQL 16 en tmpfs, sans ports publiés, sur réseau Docker interne; Redis et worker ne sont pas démarrés. La campagne Playwright US-001 a également utilisé un réseau interne sans ports ni API. Ces contrôles bornés n'entraînent aucun changement de statut.

Les preuves techniques ciblées existent maintenant pour US-001..US-006, avec les limites indiquées par story. Toutes restent `needs-review`; pour US-001 la validité du contenu légal/éditorial n'est pas prouvée. ACT-03, ACT-09, design-readiness et l'issue #297 gardent leurs gates indépendants.

## Relance navigateur locale — 23 octobre 2026

Au même SHA `4a4861d3275b0b281b53656b7b7f13aa5345d921`, 38 scénarios Playwright
uniques ont été exécutés sur Chromium local: **36 réussis, 2 échoués**. Les deux
échecs sont les parcours « réessayer après erreur API » des chaînes et des
tirages; l'échec chaînes s'est reproduit lors d'un retry diagnostique. Les
handlers `page.route()` simulent les API. Cela couvre le rendu et les réactions
UI, sans HTTP métier, backend, base de données ni persistance. Le rapport brut
et les traces sont conservés hors dépôt dans
`/private/tmp/skkup-p0-browser-e2e-2026-10-23.md` et le dossier temporaire
associé.

| Story | Résultat navigateur frais et limites restantes |
| --- | --- |
| US-001 | Vitrine/destinations, FAQ et règlement exécutés; les données reposent en partie sur des mocks/fallbacks. Pas de revue juridique ou éditoriale. |
| US-002 | Inscription et formulaire exécutés; routes auth simulées. Aucun compte, hachage, doublon, session ou persistance vérifié. |
| US-003 | Accessibilité clavier de l'extension et génération du code exécutées; pairing/session simulés. Aucune consommation unique, expiration, révocation ou limite réelle vérifiée. |
| US-004 | Catalogue et filtres exécutés; aucun E2E de heartbeat, crédit de points, plafond ou idempotence. |
| US-005 | Dans cette campagne du 23 octobre sur le SHA historique, historique et grattage de récompense exécutés avec API simulée; aucun E2E de check-in, streak, paliers, reset, bonus unique ou ledger durable. La preuve E2E HTTP/PostgreSQL ajoutée le 28 octobre est consignée dans la section datée ci-dessus et ne faisait pas partie de cette campagne. |
| US-006 | Résultat public et réponses viewer simulées exécutés; aucun parcours admin réel, permission, CSPRNG ou audit persistant. Le test de retry tirage échoue. |

Ces résultats ne font passer aucune story ou gate à l'approbation. US-001..US-006,
ACT-06 et la readiness restent inchangés.

## Point de preuve Notifications — 22 octobre 2026

Le parcours modal Notifications viewer a été vérifié séparément des stories P0
US-001 à US-006. Sur les sources frontend locales de la branche dédiée, le run
Chromium réussi couvre trois viewports (1280×850, 390×850, 320×850), le focus
initial et son confinement, le clic réel sur le backdrop sans fermeture ni
perte de focus, Escape, la fermeture explicite, la restitution du focus et
l’absence de débordement horizontal. Le serveur Next.js était en mode
développement et les réponses API étaient simulées. Les commandes de
reproduction, empreintes et artefacts sont dans les
[preuves navigateur Notifications](evidence/mvp001-notifications-browser-20261022/README.md).

La relecture du code et des tests vérifie aussi l’audience viewer, le
rechargement à l’ouverture, l’absence d’état de lecture/compteur, l’affichage
texte brut, la taille du bouton et le contrôle d’accès API. Le propriétaire a
confirmé le 2026-10-22 la cible à trois états `DRAFT` / `PUBLISHED` /
`ARCHIVED`; la [conception du cycle](../design/announcement-lifecycle-2026-10-22.md)
formalise les transitions et la migration conservatrice. Le schéma et le
service implémentent désormais un statut brouillon distinct. La QA du
2026-10-23 a appliqué les migrations sur PostgreSQL jetable et vérifié le
backfill; un test HTTP intégré contre PostgreSQL réel couvre un cycle
`DRAFT` → `PUBLISHED` → `ARCHIVED` → restauration, la visibilité viewer et
l'audit. La régression UI couvre deux cycles archive → restauration avec API
simulée; elle ne constitue pas une preuve de persistance. La suite E2E backend
a aussi réussi localement avec PostgreSQL et Redis jetables, mais la CI sur la
branche et le commit livrés reste à obtenir. Ce checkpoint n’approuve pas le
design global, ne ferme aucune story et ne prouve aucun déploiement; les gates
de readiness restent ouvertes.

## Portée et limites de la preuve

Chaque story P0 doit être reliée à une commande ou un test reproductible, à un
parcours navigateur si elle possède une interface, aux états chargement/vide/
erreur/succès/interdit ou désactivé applicables, et aux viewports 320/768/1280
pour les écrans responsive. Les preuves absentes restent `needs-review` et
interdisent le passage de `design-readiness.md` à `approved`.

La campagne archivée est une preuve QA locale sous Docker, non une preuve de
préproduction ou de production. Elle ne prouve donc pas l'alerting, le canal de
notification, l'astreinte, le rollback applicatif, la restauration complète
exercée ni l'approbation de conception. Ces éléments restent des obligations
distinctes à produire et à faire relire indépendamment.

Les liens relatifs de la colonne « preuves existantes » sont intentionnels :
ils pointent vers les artefacts versionnés avec cette matrice et non vers un
résultat distant non relu. Aucun état `needs-review` n'est converti en
`verified` par la présence de tests locaux.

## Campagnes historiques

Les chiffres ci-dessous appartiennent aux campagnes archivées ou aux rapports
datés du 2026-10-07, 2026-10-08 ou 2026-10-10. Ils ne sont pas les runs isolés
du 2026-10-18 décrits plus bas et restent soumis à leurs limites et à la
relecture indépendante. Les valeurs signalées comme « déclarées, brut absent ou
non réconciliées » sont conservées pour l'historique, sans artefact brut
permettant de les vérifier et ne constituent pas une preuve. Voir le
[relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18).

- `frontend/e2e/dashboard-responsive-live.spec.ts` : 6 tests authentifiés
  Docker réussis pour US-005 et US-006 aux trois viewports requis, résultat
  historique rapporté.
- Après le correctif frontend `dcf9b6d`, les suites
  `dashboard-v3-secondary-live.spec.ts` et
  `dashboard-viewer-main-live.spec.ts` : 116/116 tests réussis dans Docker,
  chiffre historique déclaré, brut absent et non réconcilié avec les sources
  actuelles; non vérifié. Le rapport ACT-06 relève une incompatibilité avec les
  sources et cas actuels. Les domaines annoncés incluent permissions admin,
  titres, responsive, reduced motion, zoom 200 % et cibles tactiles.
- `frontend/e2e/dashboard-v3-prototype.spec.ts` : 12 tests réussis, chiffre
  historique déclaré sans rapport brut; non vérifié. Le périmètre annoncé
  couvre états, reduced motion, contrastes et focus clavier du prototype.
- Tests backend ciblés P0 : 31 suites et 247 tests réussis dans Docker, chiffres
  historiques déclarés sans artefact brut; non vérifiés (`src/auth`, `src/extension`, `src/watch-sessions`,
  `src/me`, `src/realtime`, `src/scratch-cards`, `src/streams`, `src/raffles`,
  `src/admin-lots`, `src/admin-users`, `src/common/throttler.guards.spec.ts`).
  La relance locale hors Docker a obtenu 30 suites réussies sur 31 et 244 tests
  sur 247, avec trois erreurs `listen EPERM` dans la suite de throttling. Les
  logs de refus d'accès administrateur sont observés pendant les tests.
- Après reconstruction de l'image frontend Docker depuis `9dacd69`, le rapport
  déclare 11/11 tests pour `frontend/e2e/responsive-accessibility.spec.ts` sur
  le projet desktop; résultat historique sans artefact brut correspondant,
  donc non vérifié ici. Le périmètre annoncé inclut la visite à la connexion.
- Suite frontend Vitest après le correctif : 32 fichiers, 120 tests réussis et
  6 tests ignorés, chiffres historiques déclarés sans artefact brut
  correspondant; non vérifiés ici.
- Ces résultats historiques ne sont pas une approbation et restent soumis à
  la relecture indépendante et ne ferment pas seuls les stories P0.

## Runs isolés QA du 2026-10-18

Cette section rapporte seulement les exécutions isolées du 2026-10-18. Les
commandes non conservées dans le relevé QA ne sont pas reconstituées. Les
limites complètes et la provenance par story figurent dans le
[relevé ACT-06 du 2026-10-18](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18).
Les erreurs de chargement backend faute de client Prisma consignées dans le
tableau ci-dessous décrivent les tentatives initiales, avant génération. Elles
sont conservées comme historique et ne décrivent pas l'état de la reprise
postérieure, documentée dans [l'archive des résultats unitaires](evidence/p0-backend-unit-2026-10-18/README.md).

| Story | Commande / exécution consignée | Résultat réellement exécuté | Suites non chargées / limites |
| --- | --- | --- | --- |
| US-001 | `frontend/`: `./node_modules/.bin/vitest run src/app/page.test.tsx` | Code 0; 1 fichier, 1 test. Source et spec identiques à `origin/dev`. | Vitest/jsdom seulement; aucun navigateur, serveur, API, BDD ou validation légale. Autre test légal: `./node_modules/.bin/vitest run src/components/legal/ReglementPublicContent.test.tsx`, code 0, 1 fichier/2 tests; composant/spec identiques à `origin/dev`. |
| US-002 | `frontend/`: `npm test -- src/components/auth/FormulaireAuth.test.tsx` | Code 0; 11 tests. Environnement Vitest 4.1.11, Node 26.10.0, npm 11.19.1; 465 packages installés hors ligne dans le worktree isolé. Depuis `backend/`: `npm test -- --runInBand src/auth/dto/register.dto.spec.ts`, code 0, 1 suite/1 test. | Checkout racine frontend: aucun test démarré, binding natif `rolldown` manquant; récupéré dans le worktree isolé. Backend controller: `npm test -- --runInBand src/auth/auth.controller.spec.ts`, code 1 avant test, client Prisma absent. Aucun parcours HTTP/API/BDD. Les tests frontend n'assertent pas l'absence du message positif. |
| US-003 | Frontend: `./node_modules/.bin/vitest run src/components/extension/CodeAppariement.test.tsx`. Backend: `npm test -- --runInBand src/extension/extension.service.spec.ts src/extension/extension-auth.guard.spec.ts src/extension/jetons-extension.spec.ts`. | Frontend: code 0, 1 suite/10 tests. Backend: 11 tests jetons passés, code global 1. Sources/specs pairing identiques à `origin/dev`. | `extension.service` et `extension-auth.guard`: aucun test démarré, client Prisma absent. Aucun E2E extension, appairage réel, HTTP ni expiration/révocation persistée. |
| US-004 | `frontend/`: `npm test -- src/hooks/useSessionVisionnage.test.tsx` (script `test` → `vitest run`) | Code 0; 1 fichier/5 tests; Node 26.10.0, npm 11.19.1, Vitest 4.1.11; source et spec sans diff avec `origin/dev` au commit `7887791`. Le run existant `./node_modules/.bin/vitest run src/lib/watch-sessions.test.ts` reste 1 suite/3 tests. | Hook frontend sous mocks seulement; aucun HTTP réel ni serveur prouvé. Backend : Jest 30.4.2 et `@prisma/client` 7.10.0 disponibles, mais `generated/prisma` absent; aucun test backend, génération client, DB ou service exécuté. Pas de preuve DB/Redis/BullMQ, heartbeat HTTP, persistance ou idempotence. ERR-HEARTBEAT : « ignorer sans crédit » reste non réconcilié avec les rejets `BadRequestException` des specs. |
| US-005 | `frontend/`: `./node_modules/.bin/vitest run src/components/dashboard/HistoriquePointsViewer.test.tsx`. | Vitest/jsdom, 4/4 tests; composant et spec identiques à `origin/dev`. | À la date du run du 18 octobre: aucune preuve E2E, API ou persistance; cette observation historique précède l'E2E HTTP/PostgreSQL du 28 octobre. Les anciens specs n'assertaient pas explicitement les seuils 3/7/14/30; voir la preuve actuelle dans la matrice principale. |
| US-006 | Frontend: `./node_modules/.bin/vitest run src/components/admin/RafflesAdminV3.test.tsx src/components/raffles/ListeTirages.test.tsx`. Backend: `npm test -- --runInBand src/raffles/raffles.controller.spec.ts src/raffles/raffles.service.spec.ts src/raffles/raffle-draw.spec.ts src/raffles/tirage.spec.ts`. | Frontend: code 0, 2 suites/24 tests, sources/specs correspondants identiques à `origin/dev`. Backend: seul `raffle-draw.spec.ts`, 16 tests réussis; code global 1. | Trois suites backend n'ont exécuté aucun test faute de client Prisma généré. Aucun Prisma généré, service ou Docker. Pas de navigateur, HTTP réel, permission, persistance ou audit durable. |

### Reprise complète après génération Prisma

Une exécution backend ultérieure sur `6d9cc76` a réussi après génération du
client Prisma 7.10.0 : `npm test -- --runInBand --silent`, code 0, 44 suites,
296 tests réussis, 0 échec et 0 pending. Elle couvre notamment les suites
backend nommées ci-dessus pour US-002 à US-006; le détail des suites et tests
par domaine est dans le [rapport durable](evidence/p0-backend-unit-2026-10-18/README.md).
US-001 n'a pas de suite backend directement attribuable. Les résultats
frontend frais, dont les six tests Notifications skipped, sont également
consignés dans ce rapport et son JSON brut.

Le diff `6d9cc76..origin/dev` (`origin/dev` `8f4795d`) ne touche aucun fichier
`backend/`, `frontend/` ou `extension/`. Ces exécutions restent unitaires :
elles ne prouvent pas HTTP réel, DB/PostgreSQL, Redis/BullMQ, E2E, rendu
navigateur ou authentification production. Les six tests Vitest skipped sont
un gap explicite. Les états `needs-review` des stories ne changent pas.

Pour chaque story, les exécutions ci-dessus sont partielles et ne changent pas
son statut. `US-001` à `US-006` restent `needs-review`; voir le
[relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). `US-007` est P1 et
reste complémentaire, non incluse dans la matrice P0.

## Artefacts bruts archivés le 2026-10-08

La campagne live complète 62/62 est rattachée à
`docs/quality/evidence/p0-live-2026-10-08/README.md`, avec un artefact PNG
brut, les rapports Playwright et backend bruts, et la commande exacte de
reproduction. Le snapshot des gates est également versionné dans
`docs/quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv`. Cette archive renforce la
traçabilité mais ne transforme pas seule les six stories en `verified` : la
nouvelle relecture indépendante reste obligatoire.

## Vérification QA ciblée du 2026-10-07

Le rapport indépendant `qa-p0-targeted-2026-10-07.md` ajoute une campagne
locale ciblée : Playwright `responsive-accessibility.spec.ts` à 11/11 et dix
suites backend P0 à 87/87. Docker était inaccessible dans cette session
(`permission denied` sur le socket local), donc cette campagne ne remplace pas
les preuves Docker authentifiées ni la relecture indépendante. Les six stories
restent `needs-review` avec les limites détaillées dans le rapport.

## Relance indépendante du 2026-10-07

La relance backend ciblée a détecté 31 suites et 247 tests, dont 30 suites
réussies et 3 échecs dans `common/throttler.guards.spec.ts`, causés par
`listen EPERM: operation not permitted 0.0.0.0` hors environnement Docker.
La preuve historique `31 suites / 247 tests réussis` ne doit donc pas être
présentée comme reproductible dans ce contexte.

## Responsables de reprise

- QA : rejouer les tests et produire les captures authentifiées.
- Frontend : corriger les écarts de structure, états, clavier et motion.
- Auditeur : relire la matrice et les preuves après correction.
- Conformité : valider rétention, export, suppression et licences médias.
