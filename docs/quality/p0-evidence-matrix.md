# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuve technique disponible | Preuve manquante | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | `frontend/e2e/responsive-accessibility.spec.ts`; tests frontend historiques | capture actuelle des contenus publics et relecture indépendante | needs-review |
| US-002 | FLOW-001, API-001 | `backend/src/auth/auth.service.spec.ts`, `auth.controller.spec.ts`, `register.dto.spec.ts`; E2E Docker auth | preuve indépendante du parcours inscription/connexion et erreurs | needs-review |
| US-003 | FLOW-001, API-002 | `backend/src/extension/extension.service.spec.ts`, `extension-auth.guard.spec.ts`, `watch-sessions/watch-session-credential.guard.spec.ts`, `watch-sessions.service.spec.ts` | expiration/révocation live et relecture indépendante | needs-review |
| US-004 | FLOW-001, API-002 | `backend/src/me/me.service.spec.ts`, `realtime/realtime.service.spec.ts`, `realtime/realtime.gateway.spec.ts`, `common/throttler.guards.spec.ts` | matrice complète erreur/limite/dépendance et preuve E2E métier | needs-review |
| US-005 | FLOW-001, API-004 | `backend/src/scratch-cards/scratch-cards.service.spec.ts`, `me/me.service.spec.ts`, `streams/streams.service.spec.ts`; suites Docker viewer 116/116 | preuve indépendante de cohérence métier et historique complet | needs-review |
| US-006 | FLOW-002, API-003 | `backend/src/raffles/raffles.controller.spec.ts`, `raffles.service.spec.ts`, `raffle-draw.spec.ts`, `admin-lots/admin-lots.service.spec.ts`, `admin-users/admin-users.service.spec.ts`; suites Docker admin 116/116 | preuve indépendante de permission, confirmation, audit et résultat | needs-review |

## Couverture attendue par preuve

Chaque story P0 doit être reliée à une commande ou un test reproductible, à un
parcours navigateur si elle possède une interface, aux états chargement/vide/
erreur/succès/interdit ou désactivé applicables, et aux viewports 320/768/1280
pour les écrans responsive. Les preuves absentes restent `needs-review` et
interdisent le passage de `design-readiness.md` à `approved`.

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
- Tests backend ciblés P0 : 31 suites, 247 tests réussis avec Jest
  (`src/auth`, `src/extension`, `src/watch-sessions`, `src/me`, `src/realtime`,
  `src/scratch-cards`, `src/streams`, `src/raffles`, `src/admin-lots`,
  `src/admin-users`, `src/common/throttler.guards.spec.ts`). Les logs de refus
  d'accès administrateur sont également observés pendant le test.
- Après reconstruction de l'image frontend Docker depuis `9dacd69`,
  `frontend/e2e/responsive-accessibility.spec.ts` passe à 11/11 sur le projet
  desktop, dont la validation automatique de la visite à la connexion.
- Suite frontend Vitest après le correctif : 32 fichiers, 120 tests réussis,
  6 tests ignorés.
- Ces résultats sont des preuves locales reproductibles; ils restent soumis à
  la relecture indépendante et ne ferment pas seuls les stories P0.

## Responsables de reprise

- QA : rejouer les tests et produire les captures authentifiées.
- Frontend : corriger les écarts de structure, états, clavier et motion.
- Auditeur : relire la matrice et les preuves après correction.
- Conformité : valider rétention, export, suppression et licences médias.
