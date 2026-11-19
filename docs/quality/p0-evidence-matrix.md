---
last_updated: 2026-11-19
owner: Mickael MUR
---

# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuves existantes et rattachement précis | Reste non prouvé / limite de portée | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | Campagne historique archivée du 2026-10-08. **Playwright Docker après le patch FAQ du 2026-10-28** : image frontend reconstruite sans cache depuis le checkout à HEAD `87e976380a686827b155ad5bb44b7f66844cbf91`, digest `sha256:4583fb7c0dc4a477ba3a73db9886df392f7d0ed73d4ce5dd602238b81d470785`; runner Playwright `v1.63.0`. Les quatre specs vitrine/FAQ/confidentialité/règlement ont d'abord produit 24/30 PASS; six échecs d'assertion du locator Accueil règlement (logo + lien texte ambigus) ont été corrigés en supprimant le retour Accueil redondant et en scoppant le test au header, puis les deux specs touchées `homepage-destinations` et `reglement-public-responsive` ont repassé 10/10 sur les projets desktop/mobile. Probe Playwright séparé: clic FAQ réussi depuis vitrine et règlement à 1280×900, 768×1024 et 390×844 (6/6); `/faq` et son titre visibles. **Smoke frais du 2026-11-18 sur le worktree HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`** : depuis `frontend/`, `env -u QA_EMAIL -u QA_PASSWORD -u QA_STORAGE_STATE PATH=/Users/krapaud/.local/node-v26.10.0/bin:$PATH QA_PORT=3917 npm exec -- playwright test e2e/homepage-destinations.spec.ts --project=desktop --output=/tmp/skkup-us001-d3679cac-playwright`, code 0, 1/1 en 3 s; le test visite la vitrine principale sans dépendre du backend. L'artefact conservé est [`us001-playwright-last-run.json`](evidence/p0-e2e-2026-11-18/us001-playwright-last-run.json), SHA-256 `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903`; les logs bruts ne sont pas persistés. La tentative précédente sans escalade a échoué avant test (`listen EPERM 127.0.0.1:3917`). | La campagne d'octobre vérifiait les liens avec stubs API/fallback, sans backend réel; le contenu légal vu en fallback/fixture n'est pas une relecture juridique/éditoriale ni preuve du contenu publié. Le nouveau résultat est un smoke desktop d'une seule page, pas une revue navigateur complète, responsive ou juridique. Aucun autre rendu n'est vérifié sur le HEAD courant. US-001 reste `needs-review`. | needs-review |
| US-002 | FLOW-001, API-001 | Campagne archivée du 2026-10-08 : `auth.service.spec.ts` et `auth.controller.spec.ts` figurent dans le rapport backend brut [`p0-live-2026-10-08/backend-jest-report.json`](evidence/p0-live-2026-10-08/backend-jest-report.json). **E2E isolé frais du 2026-11-18**, worktree HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`: `bash backend/scripts/test-isolated-e2e-docker.sh auth-lifecycle`, code 0, 12 migrations, 1/1; run `skkup-e2e-auth-lifecycle-20261118211549-46299-5733`. Le runner utilise PostgreSQL tmpfs sur réseau Docker interne et un compte synthétique; la sortie confirme le teardown conteneurs, réseau, volumes et images. | E2E technique limité à l'auth/session. Ne prouve ni preuve d'âge/consentements ni décision juridique, l'ensemble des erreurs métier ou la clôture des exigences ACT-03/05. Le run frais n'est pas une validation de conformité ni une fermeture de story. | needs-review |
| US-003 | FLOW-001, API-002 | E2E HTTP/PostgreSQL du 2026-10-28, historique : 8/8 migrations et 1/1 suite PASS, échange unique, révocation et plafond cinq appareils selon l’ancienne règle. E2E navigateur Chromium MV3 historique : 21 assertions, popup, stockage après reload, rejeu 401, credential 201 puis 401 après révocation et dissociation locale; log SHA-256 `5ff1e6721b55fab55c91822930d80a02c2525b963e78e13653a376ff0c8e50de`. **E2E isolé frais du 2026-11-18**, worktree HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`: `bash backend/scripts/test-isolated-e2e-docker.sh extension-pairing`, code 0, 12 migrations, 1/1; run `skkup-e2e-extension-pairing-20261118211611-46941-12481`. La sortie confirme PostgreSQL tmpfs sur réseau Docker interne, compte synthétique et teardown conteneurs, réseau, volumes et images. | Les anciennes preuves d'octobre décrivent les comportements et l'ancienne règle alors observés. Le nouveau test est une preuve HTTP/PostgreSQL ciblée de pairing; il ne couvre pas le navigateur Chromium, la publication Chrome Web Store, la production ni l'ensemble des exigences de l'extension. US-003 reste `needs-review`. | needs-review |
| US-004 | FLOW-001, API-002 | E2E HTTP/PostgreSQL du 2026-10-28, historique : crédit 64 vers 65 puis zéro au-delà; log SHA-256 `af460d4a375ecd6ecb90017f85c7d014022daef074979f74d601a5f3f9670d5e`. Relance unitaire ciblée du 2026-11-18 : 2 suites et 38 tests PASS au total; `watch-sessions.service.spec.ts:450-473` vérifie le plafond de 90 points et l’absence de transaction supplémentaire après le plafond. **E2E isolé du 2026-11-18** au HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`: 2/2, run `skkup-e2e-watch-session-heartbeat-20261118211626-47377-4381`. **Relance fraîche du 2026-11-19** au HEAD code `fae60bdad6648c90fcb5e155180168bdf3a07873`: `bash backend/scripts/test-isolated-e2e-docker.sh watch-session-heartbeat`, 12 migrations, code 0, 2/2; run `skkup-e2e-watch-session-heartbeat-20261119140438-25725-20455`; Final QA run `skkup-e2e-watch-session-heartbeat-20261119142138-49965-27434` passed 2/2 after 12 migrations; the isolated quota sequence recreates the Nest app and throttler store, then verifies four authenticated invalid DTOs (`400`) followed by `429` on request five. This is limited to the isolated single-process test, not production or multi-instance behavior. La sortie confirme PostgreSQL tmpfs sur réseau Docker interne, compte synthétique et teardown conteneurs, réseau, volumes et images. | Le run d'octobre vérifie l'ancien plafond de 65 et reste historique. Le run frais apporte une preuve E2E ciblée de heartbeat/points mais ne démontre pas à lui seul l'idempotence stricte, les parcours pause/invalidité temporelle, Redis/BullMQ, l'interface, ni les exigences métier complètes. Les tests ne ferment pas US-004, qui reste `needs-review`. | needs-review |
| US-005 | FLOW-001, API-004 | E2E isolé du 2026-10-28, historique : huit migrations, 1 suite / 1 test PASS sur le service final. Paliers 3/7/14/30, rejeu même jour, reset, cartes conservées, solde/ledger et historique comparé au ledger DB; run `skkup-e2e-daily-checkin-20261028160840-92043-30788`. **E2E isolé frais du 2026-11-18**, worktree HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`: `bash backend/scripts/test-isolated-e2e-docker.sh daily-checkin`, code 0, 12 migrations, 1/1; run `skkup-e2e-daily-checkin-20261118211641-47965-32567`. La sortie confirme PostgreSQL tmpfs sur réseau Docker interne, compte synthétique et teardown conteneurs, réseau, volumes et images. | Identité et dates synthétiques, notifications Realtime mockées; pas d’interface navigateur raccordée. Les types et montants de récompense restent non définis par le cahier accepté. Ce run ne ferme pas US-005, qui reste `needs-review`. | needs-review |
| US-006 | FLOW-002, API-003 | E2E isolé du 2026-10-28, historique : l'exécution initiale a reproduit une incohérence HTTP 201 / ticket créé contre tirage figé à zéro (`e95ae310...`), corrigée par un verrou `SELECT ... FOR UPDATE` avant relecture d'éligibilité; retest 1 suite / 3 tests PASS, run `skkup-e2e-raffle-admin-draw-20261028160702-90087-31077`. **E2E isolé du 2026-11-18** au HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`: 3/3, run `skkup-e2e-raffle-admin-draw-20261118211702-48469-25318`. **Relance fraîche du 2026-11-19** au HEAD code `fae60bdad6648c90fcb5e155180168bdf3a07873`: `bash backend/scripts/test-isolated-e2e-docker.sh raffle-admin-draw`, 12 migrations, code 0, 3/3; run `skkup-e2e-raffle-admin-draw-20261119140501-26455-18484`; Final QA run `skkup-e2e-raffle-admin-draw-20261119142444-56522-27013` passed 3/3 after 12 migrations, covering `429` on the sixth request and a synthetic PostgreSQL audit trigger returning `500` with rollback, including before/after comparison of seven mutable fields and zero audit row/winner, plus opening without a seed. The trigger is a synthetic failure in disposable PostgreSQL. La sortie confirme PostgreSQL tmpfs sur réseau Docker interne, compte synthétique et teardown conteneurs, réseau, volumes et images. | Les nouveaux résultats restent limités à cette suite; le snapshot immuable d'IDs, l'ordre inverse de la course et l'exécution via le processus worker déployé ne sont pas établis par cette preuve. Pas de parcours UI ni décision juridique/conformité. US-006 reste `needs-review`. | needs-review |

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

Les runners Compose isolés ont produit les preuves HTTP/PostgreSQL d'octobre pour US-002..US-006, avec huit migrations chacune. Les détails de cette campagne restent historiques. Ces preuves ne sont pas remplacées par les exécutions de novembre ci-dessous et aucun statut n'est modifié.

## Relance ciblée sur le worktree courant — 18 novembre 2026

Sur le worktree à HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`, cinq E2E backend isolés ont terminé avec code 0. La commande utilisée est `bash backend/scripts/test-isolated-e2e-docker.sh <suite-key>` pour chacune des suites ci-dessous. Chaque run a appliqué 12 migrations, utilisé PostgreSQL en tmpfs sur un réseau Docker interne et des comptes synthétiques; les sorties confirment le teardown des conteneurs, réseau, volumes et images. Aucun rapport brut des suites backend n'a été conservé.

| Story | Suite / identifiant du run | Résultat | Portée de la preuve |
| --- | --- | --- | --- |
| US-002 | `auth-lifecycle` — `skkup-e2e-auth-lifecycle-20261118211549-46299-5733` | 1/1; code 0 | Cycle d'authentification/session exercé en E2E isolé. |
| US-003 | `extension-pairing` — `skkup-e2e-extension-pairing-20261118211611-46941-12481` | 1/1; code 0 | Appariement extension exercé en E2E isolé. |
| US-004 | `watch-session-heartbeat` — `skkup-e2e-watch-session-heartbeat-20261119140438-25725-20455` (HEAD code `fae60bd`) | 2/2; code 0; 12 migrations | Heartbeat HTTP/PostgreSQL exercé à jour au SHA code. Le run `d3679cac` du 18 novembre est historique. |
| US-005 | `daily-checkin` — `skkup-e2e-daily-checkin-20261118211641-47965-32567` | 1/1; code 0 | Check-in quotidien exercé en E2E isolé. |
| US-006 | `raffle-admin-draw` — `skkup-e2e-raffle-admin-draw-20261119140501-26455-18484` (HEAD code `fae60bd`) | 3/3; code 0; 12 migrations | Route admin, permissions, mutation et audit exercés par assertions E2E/PostgreSQL. Le run `d3679cac` du 18 novembre est historique. |

Le smoke navigateur US-001, sur le même HEAD, a exécuté depuis `frontend/` la commande `env -u QA_EMAIL -u QA_PASSWORD -u QA_STORAGE_STATE PATH=/Users/krapaud/.local/node-v26.10.0/bin:$PATH QA_PORT=3917 npm exec -- playwright test e2e/homepage-destinations.spec.ts --project=desktop --output=/tmp/skkup-us001-d3679cac-playwright`: code 0, 1/1 en 3 secondes. La page vitrine principale est visitée sans dépendance au backend. L'artefact conservé est [`us001-playwright-last-run.json`](evidence/p0-e2e-2026-11-18/us001-playwright-last-run.json), SHA-256 `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903`; aucun rapport brut n'est conservé. La tentative précédente sans escalade a échoué avant le test avec `listen EPERM 127.0.0.1:3917`.

Cette passe est limitée aux cinq suites E2E backend ci-dessus et à un smoke Playwright desktop sur la vitrine. Elle ne constitue pas une revue juridique, un audit responsive ou une revue navigateur complète. Elle ne ferme aucune story ou gate: tous les statuts `needs-review` restent inchangés.

## Relances E2E API-002/API-003 au HEAD code `fae60bd` — 19 novembre 2026

Les suites `watch-session-heartbeat` et `raffle-admin-draw` ont été exécutées
au HEAD code `fae60bdad6648c90fcb5e155180168bdf3a07873`. Chaque run a appliqué
12 migrations et terminé avec code 0:

| Suite | Run initial | Résultat | Run QA de couverture complémentaire | Résultat / portée complémentaire |
| --- | --- | --- | --- | --- |
| `watch-session-heartbeat` | `skkup-e2e-watch-session-heartbeat-20261119140438-25725-20455` | 2/2 | `skkup-e2e-watch-session-heartbeat-20261119142138-49965-27434` | 2/2; deux appels valides et DTO invalide `400`. Le run final isolé vérifie quatre DTO invalides authentifiés (`400`), puis `429` au cinquième appel; application Nest et store throttler sont recréés avant la séquence quota. |
| `raffle-admin-draw` | `skkup-e2e-raffle-admin-draw-20261119140501-26455-18484` | 3/3 | `skkup-e2e-raffle-admin-draw-20261119142444-56522-27013` | 3/3; `429` à la sixième requête single-process; trigger PostgreSQL d'audit synthétique donne `500` et vérifie le rollback, dont sept champs mutables inchangés et zéro audit/gagnant; ouverture sans seed. Pas de panne réelle de production. |

Une première tentative Docker en sandbox a été bloquée avant le lancement des
tests; aucune assertion n'a démarré. Les relances locales autorisées ont réussi.
Aucun rapport brut de sortie n'a été conservé. Les runs du 2026-11-18 au SHA
`d3679cac` restent historiques.

Le run final heartbeat recrée l’application Nest et le store throttler avant la séquence quota; quatre DTO invalides authentifiés donnent `400`, puis le cinquième appel donne `429`. Ce résultat est une preuve limitée au test isolé single-process, sans portée production/multi-instance. Le `429` du tirage admin est observé dans le run single-process, sans preuve
production/multi-instance. L'injection d'échec d'audit est synthétique. Aucune
CI au SHA testé n'est établie et les autres critères ACT/readiness restent ouverts.

## Vérification unitaire ciblée ACT-07 / US-007 — 19 novembre 2026

Sur le HEAD `55c84793fbf8c07007847b0f191459ac3f676e32`, les deux suites Backend
déjà identifiées comme non exécutées dans le relevé ACT-07 ont été lancées depuis
`backend/` avec la commande exacte :

```sh
./node_modules/.bin/jest --runInBand --runTestsByPath src/fraud-flags/fraud-flags.service.spec.ts src/admin-users/admin-users.service.spec.ts
```

Résultat : code 0, 2 suites réussies, 4 tests réussis, aucun snapshot. Environnement :
Node `v26.10.0`, npm `11.19.1`, Jest `30.4.1`. Les quatre sources et specs
concernées sont identiques à `origin/dev` sur les chemins ciblés; le HEAD testé
ne diffère de `origin/dev` que par des commits de documentation et deux
commentaires Backend.

Portée : les tests couvrent le filtrage et l'absence d'un signalement fraude,
ainsi que le refus d'auto-désactivation et la mutation de désactivation avec
invalidation de session et audit simulés. Ce sont des tests unitaires avec
Prisma mocké. Ils ne prouvent ni permission au niveau HTTP, ni persistance,
ni réactivation du compte, ni audit intégré sur PostgreSQL. Aucun E2E du
18 novembre n'a été rejoué. US-007 et ACT-07 restent `needs-review`; le
parcours HTTP/DB de désactivation et réactivation a ensuite été testé
séparément comme suit.

## Vérification E2E ciblée ACT-07 / US-007 — 19 novembre 2026

La suite `auth-lifecycle` a été exécutée depuis la racine du dépôt :

```sh
bash backend/scripts/test-isolated-e2e-docker.sh auth-lifecycle
```

Résultat final : code 0, 12 migrations, 1 suite et 2 tests réussis; run
`skkup-e2e-auth-lifecycle-20261119150154-52304-8588`, sur un worktree basé sur
le code HEAD `fae60bd`. Une tentative initiale dans le sandbox a été bloquée
sur l'accès au socket Docker avant le lancement des tests; la relance locale
autorisée a terminé normalement.

Le nouveau cas vérifie les refus HTTP anonyme `401` et Viewer `403`, puis
l'autorisation Admin `200`, la désactivation/réactivation du compte, la
persistance d'`actif`, l'incrément unique de `sessionVersion`, la révocation
persistée de la session cible et deux événements d'audit avec acteur, cible et
métadonnées exactes. Les fixtures sont synthétiques et nettoyées dans `afterAll`.
Cette preuve ne couvre pas l'usage d'un ancien jeton après réactivation, les
autres parcours admin, le runtime déployé ou la CI au SHA de livraison; ACT-07
et US-007 restent `needs-review`.

## Vérification unitaire ciblée du chemin AdminGuard — 19 novembre 2026

Commande exécutée depuis `backend/` :

```sh
npm test -- --runInBand --runTestsByPath src/auth/guards/admin.guard.spec.ts
```

Résultat : code 0, 1 suite/5 tests PASS. Le cas de refus VIEWER fournit
`url='/admin/SECRET_TEST'` et `request.route.path='/admin/:id'`, vérifie que
ce modèle est journalisé et que la valeur sensible de l'URL n'apparaît pas. Le test exerce le guard avec
JWT guard mocké, Prisma mocké et logger espionné; il ne valide ni un pipeline
centralisé de journaux, ni déploiement/rétention, ni les autres chemins de
refus. ACT-05 reste `needs-review`.

## Vérification E2E ciblée de l'adaptateur Socket.IO/Redis — 19 novembre 2026

Commande exécutée au SHA code `fae60bdad6648c90fcb5e155180168bdf3a07873` :

```sh
bash backend/scripts/test-isolated-e2e-docker.sh realtime-redis-adapter
```

Run `skkup-e2e-realtime-redis-adapter-20261119152622-3280-30476` : code 0,
12 migrations du runner, 1 suite/1 test PASS, test non ignoré. Redis réel
temporaire dessert deux serveurs Socket.IO; une commande `disconnectSockets`
ciblant la room de la session A ferme son client et retire sa room du serveur B,
tandis que la session B et sa room restent actives. Teardown confirmé pour les
conteneurs PostgreSQL/Redis, le réseau interne et l'image du run.

Portée limitée à l'adaptateur avec un middleware synthétique : cette suite
n'exerce ni `JwtStrategy`, ni la base de sessions, ni
`SessionRevocationService`, ni `RealtimeGateway`, ni le logout ou la
désactivation admin. Les deux serveurs tournent dans un même processus/
conteneur; aucune preuve de processus/hôtes déployés, HA Redis, TLS, ou
comportement en production n'en découle. PostgreSQL et les migrations sont
préparés par le runner, mais ne sont pas consommés par cette spec. ACT-05/ACT-07
et la readiness restent `needs-review`.

## Vérification E2E ciblée ACT-05 socket/logout — 19 novembre 2026

Run `skkup-e2e-auth-lifecycle-20261119155550-82595-19381`, code 0, 12
migrations et 2/2 tests au HEAD testé
`198cdc0b28edf395f916e77360f47ea6dbaf7918`; le teardown du runner est confirmé.
Commande depuis la racine : `bash backend/scripts/test-isolated-e2e-docker.sh auth-lifecycle`.
Cette relance utilise le vrai `RealtimeGateway` et
`SessionRevocationService`, une socket authentifiée par cookie et la session DB;
après `POST /auth/logout`, le client reçoit `io server disconnect`.

La preuve couvre ce scénario intégré dans un seul processus. Elle ne démontre
pas la propagation inter-processus/déploiement, les autres chemins de révocation
(changement de mot de passe ou désactivation admin), ni la CI au SHA de livraison.
ACT-05/ACT-07 et la readiness restent `needs-review`.

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

## US-008 Cycle des annonces

Les rapports QA locaux du 30 octobre 2026 rapportent le cycle `DRAFT` →
`PUBLISHED` → `ARCHIVED` → restauration sur PostgreSQL jetable. Ils rapportent
que le runner Docker `bash backend/scripts/test-isolated-e2e-docker.sh
announcements-lifecycle` a appliqué huit migrations et exécuté deux tests
E2E, que les cinq mutations admin ont répondu HTTP 403 à un JWT `VIEWER` sans
appel métier, et que la suite frontend ciblée a réussi 14 tests, dont le rejet
d'une réponse asynchrone périmée. La suite ciblée du compteur de non-lus a
depuis été exécutée sur le commit d'implémentation
`21b50529fe019d788ee34851f1832d239a81ce87`: backend 25 tests unitaires,
contrôleur HTTP 7/7, frontend 16/16; typechecks backend/frontend, lint ciblé,
build backend et validation Prisma réussis. Le runner
`bash backend/scripts/test-isolated-e2e-docker.sh announcements-lifecycle` a
appliqué dix migrations et passé 2/2 tests sur PostgreSQL isolé; son teardown
a supprimé conteneur, réseau et image. Le parcours HTTP dédié vérifie aussi le
compte publié, l'exclusion des annonces archivées et le compte après lecture.
Le client conserve les IDs lus localement par profil/navigateur; il n'y a pas
de synchronisation entre appareils. Le badge visuel est plafonné à `9+`, tandis
que son libellé accessible donne le nombre exact.

### E2E HTTP ciblé viewer — 19 novembre 2026

Au SHA `8431aa7dfe463641311ef1391511013265774dc2`, la suite existante
`backend/test/announcements-viewer.e2e-spec.ts` a passé 1 suite/7 tests, code 0,
sans test ignoré. Commande depuis `backend/` :

```sh
npm run test:e2e -- --runInBand test/announcements-viewer.e2e-spec.ts
```

Une tentative sandbox s'est arrêtée avant assertions sur `listen EPERM`; la
relance autorisée de la même commande a réussi. Les cas vérifient GET anonyme
`401` sans appel au service, POST `unread-count` Viewer/Admin `201`, refus
anonyme `401`, IDs dupliqués `400` sans appel au service, et GET Viewer/Admin
`200` avec réponse mockée et curseur transmis. La session et le compte sont
synthétiques; `PrismaService` et `AnnouncementsService` sont mockés. Cela ne
prouve pas filtrage DB, cycle lifecycle, persistance, audit, throttling `429`,
expiration de session ou rendu/modal. US-008 et les gates ACT-04/08/11 restent
ouverts.

Une relance après l'ajout d'un cas de session révoquée a passé 1 suite/8 tests,
code 0, non ignorée, au SHA `a3965bb79ae6b9bf5cd953871259791830019e06`. Avec un JWT
valide et `revokedAt` non nul dans le mock d'AuthSession, GET renvoie `401` et
`AnnouncementsService.publieesPourViewer` n'est pas appelé. AuthSession reste
mockée : cette extension ne prouve pas la persistance du refus en PostgreSQL.
La première tentative sandbox a échoué sur `listen EPERM` avant assertions; la
relance autorisée de la commande ciblée a réussi. Le nouveau run ne possède pas
d'artefact brut versionné.

Les rapports détaillés du cycle restent locaux et ne sont pas présents comme
artefacts durables dans le dépôt. Les exécutions antérieures du compteur de
non-lus citées ci-dessus sont rattachées au commit d'implémentation
`21b50529fe019d788ee34851f1832d239a81ce87`, ancêtre du head de cette branche;
les sorties brutes n'étant pas archivées, leur vérification indépendante et
leur reproduction à partir des artefacts restent limitées. Les résultats
historiques du 30 octobre ne consignent pas le SHA de leur branche source et
ne peuvent pas être reliés précisément à ce checkout. Aucun de ces résultats
ne prouve une CI ou une livraison. Cette preuve ciblée ne vaut ni approbation
de conception ni validation globale de la readiness. Aucun rendu authentifié
réel ou déploiement n'est déduit. Le
statut US-008 demeure `needs-review`. Ces exécutions locales ne constituent
pas une CI, une revue visuelle authentifiée ou une preuve de déploiement. Le
prototype Notifications est archivé
séparément et ne constitue pas une preuve du comportement produit.

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
