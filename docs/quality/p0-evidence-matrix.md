---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuves existantes et rattachement précis | Reste non prouvé / limite de portée | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | `frontend/e2e/responsive-accessibility.spec.ts` couvre l'accès responsive et l'état public; la campagne brute est archivée dans [`p0-live-2026-10-08/playwright-report.json`](evidence/p0-live-2026-10-08/playwright-report.json). | Le contenu public actuel, ses liens légaux et sa relecture indépendante ne sont pas archivés dans cette campagne. Aucun résultat de conformité éditoriale n'est déduit des tests de rendu. | needs-review |
| US-002 | FLOW-001, API-001 | `backend/src/auth/auth.service.spec.ts`, `auth.controller.spec.ts`, `register.dto.spec.ts` couvrent le service, le contrôleur et la validation; le rapport backend brut est [`p0-live-2026-10-08/backend-jest-report.json`](evidence/p0-live-2026-10-08/backend-jest-report.json). | Une preuve indépendante de bout en bout inscription → connexion, des erreurs exposées à l'utilisateur et de la révocation de session n'est pas produite. Le rapport technique ne vaut pas validation métier indépendante. | needs-review |
| US-003 | FLOW-001, API-002 | `backend/src/extension/extension.service.spec.ts`, `extension-auth.guard.spec.ts`, `watch-sessions/watch-session-credential.guard.spec.ts`, `watch-sessions.service.spec.ts` couvrent les gardes et services; les tests authentifiés du rapport Playwright archivé couvrent les écrans qui consomment ces sessions. | L'expiration et la révocation observées en parcours live, leur effet côté extension et une relecture indépendante restent non prouvées. | needs-review |
| US-004 | FLOW-001, API-002 | `backend/src/me/me.service.spec.ts`, `realtime/realtime.service.spec.ts`, `realtime/realtime.gateway.spec.ts`, `common/throttler.guards.spec.ts`; [`playwright-report.json`](evidence/p0-live-2026-10-08/playwright-report.json) documente 62/62 scénarios UI authentifiés et [`backend-jest-report.json`](evidence/p0-live-2026-10-08/backend-jest-report.json) 43 suites/288 tests. | La couverture combinée ne constitue pas une matrice métier indépendante des erreurs, limites, dépendances et reprise. Les seuils d'exploitation et leurs alertes ne sont pas prouvés. | needs-review |
| US-005 | FLOW-001, API-004 | `backend/src/scratch-cards/scratch-cards.service.spec.ts`, `me/me.service.spec.ts`, `streams/streams.service.spec.ts`; les scénarios viewer live et le rapport brut Playwright sont archivés dans [`p0-live-2026-10-08`](evidence/p0-live-2026-10-08/). | La cohérence métier de bout en bout, l'historique complet et la relecture indépendante des transitions succès/vide/erreur restent non prouvés. | needs-review |
| US-006 | FLOW-002, API-003 | `backend/src/raffles/raffles.controller.spec.ts`, `raffles.service.spec.ts`, `raffle-draw.spec.ts`, `admin-lots/admin-lots.service.spec.ts`, `admin-users/admin-users.service.spec.ts`; les routes admin aux trois viewports sont présentes dans [`playwright-report.json`](evidence/p0-live-2026-10-08/playwright-report.json). | La permission, la confirmation avant mutation, l'audit et le résultat métier ne sont pas validés par un auditeur indépendant sur un parcours complet. Aucun rollback préproduction de ces mutations n'est prouvé. | needs-review |

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

## Résultats courants

- `frontend/e2e/dashboard-responsive-live.spec.ts` : 6 tests authentifiés
  Docker réussis pour US-005 et US-006 aux trois viewports requis.
- Après le correctif frontend `dcf9b6d`, les suites
  `dashboard-v3-secondary-live.spec.ts` et
  `dashboard-viewer-main-live.spec.ts` totalisent 116/116 tests réussis dans
  Docker, incluant permissions admin, titres, responsive, reduced motion,
  zoom 200 % et cibles tactiles.
- `frontend/e2e/dashboard-v3-prototype.spec.ts` : 12 tests réussis, couvrant
  états, reduced motion, contrastes et focus clavier du prototype.
- Tests backend ciblés P0 : la preuve historique Docker est de 31 suites et
  247 tests réussis (`src/auth`, `src/extension`, `src/watch-sessions`,
  `src/me`, `src/realtime`, `src/scratch-cards`, `src/streams`, `src/raffles`,
  `src/admin-lots`, `src/admin-users`, `src/common/throttler.guards.spec.ts`).
  La relance locale hors Docker a obtenu 30 suites réussies sur 31 et 244 tests
  sur 247, avec trois erreurs `listen EPERM` dans la suite de throttling. Les
  logs de refus d'accès administrateur sont observés pendant les tests.
- Après reconstruction de l'image frontend Docker depuis `9dacd69`,
  `frontend/e2e/responsive-accessibility.spec.ts` passe à 11/11 sur le projet
  desktop, dont la validation automatique de la visite à la connexion.
- Suite frontend Vitest après le correctif : 32 fichiers, 120 tests réussis,
  6 tests ignorés.
- Ces résultats sont des preuves locales reproductibles; ils restent soumis à
  la relecture indépendante et ne ferment pas seuls les stories P0.

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
