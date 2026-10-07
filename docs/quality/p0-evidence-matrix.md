# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuve technique disponible | Preuve manquante | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | tests de navigation documentés dans les validations historiques | capture actuelle et relecture indépendante des contenus publics | needs-review |
| US-002 | FLOW-001, API-001 | tests auth backend et critères d'erreur documentés | exécution reproductible rattachée au work item et capture du parcours | needs-review |
| US-003 | FLOW-001, API-002 | tests extension et révocation présents dans l'historique | parcours authentifié live, expiration, révocation et preuve navigateur | needs-review |
| US-004 | FLOW-001, API-002 | tests ledger, idempotence et plafond documentés | matrice complète erreur/limite/dépendance et preuve E2E actuelle | needs-review |
| US-005 | FLOW-001, API-004 | règles de streak et tests historiques documentés; E2E Docker `/dashboard` réussi aux viewports 320/768/1280 | preuve indépendante de cohérence métier et historique complet | needs-review |
| US-006 | FLOW-002, API-003 | contrat admin et tests de tirage présents; E2E Docker `/admin` réussi aux viewports 320/768/1280 | preuve indépendante de permission, confirmation, audit et résultat | needs-review |

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
- Ces résultats sont des preuves locales reproductibles; ils restent soumis à
  la relecture indépendante et ne ferment pas seuls les stories P0.

## Responsables de reprise

- QA : rejouer les tests et produire les captures authentifiées.
- Frontend : corriger les écarts de structure, états, clavier et motion.
- Auditeur : relire la matrice et les preuves après correction.
- Conformité : valider rétention, export, suppression et licences médias.
