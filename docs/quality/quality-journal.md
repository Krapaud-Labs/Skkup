---
last_updated: 2026-11-19
---

# Journal qualité, bugs et risques

## Règle de fonctionnement

Ce journal est le registre chronologique des défauts, bugs, vulnérabilités, écarts de conception, régressions, résultats d'audit et corrections. Les responsables concernés le consultent avant leur revue et mettent à jour les entrées avec les preuves correspondantes. Les rapports spécialisés peuvent détailler une analyse, mais aucune anomalie ne doit exister uniquement dans un rapport isolé.

## Statuts autorisés

`open`, `in-progress`, `fixed`, `verified`, `accepted-risk`, `wont-fix`, `duplicate`, `blocked`.

Une entrée `fixed` n est pas résolue tant qu une preuve de vérification indépendante ne l a pas fait passer à `verified`. Une entrée `accepted-risk` exige une décision humaine identifiée, une échéance de révision et une mesure de réduction du risque.

## Registre principal

| ID | Date | Source | Catégorie | Gravité | Composant | Description et impact | Preuve | Responsable | Lot ou commit | Correction | Vérification | Statut | Date de clôture |
| QJ-001 | 2026-09-25 | initialisation | outillage | medium | environnement de développement | Les contrôles de prévalidation et de résolution de configuration échouaient avec Python 3.9, où `tomllib` manque | sortie historique; contrôle de sécurité exécuté ensuite | Équipe de maintenance | initialisation | fournir Python >=3.11 ou une compatibilité documentée | contrôle de sécurité vérifié; la prévalidation reste bloquée uniquement par la readiness design | in-progress | |
| QJ-002 | 2026-10-06 | QA initialisation | validation/readiness | high | parcours d'initialisation | Les preuves QA et de livraison sont maintenant présentes, mais la readiness de conception reste refusée par l'audit indépendant à cause de preuves P0, conformité et exploitation manquantes | rapports QA et d'audit datés du 2026-10-06 et 2026-10-07; validations GitHub `37632019552`, `37634055573` | Coordination du projet | initialisation; PR #215 `b1cb523`; PR #216 `193958a`; PR #219 `4693294` | traiter les écarts P0 et de conception, puis faire relire indépendamment la readiness | PR #215 à #219 fusionnées dans `dev`; CI PR #219 6/6 réussie; design-gate `needs-review` et audit-gate `pending` restent ouverts à juste titre | in-progress | |
| QJ-003 | 2026-10-23 | audit indépendant lot dashboard | identité visuelle | medium | icônes PNG ticket/tirages | Les icônes runtime ticket et tirages ne respectaient pas la demande d'utiliser le S officiel plutôt qu'une étoile ou des coutures; le glyphe était difficile à reconnaître à 24 px | rapports locaux QA et d'audit datés du 2026-10-23; empreintes consignées dans les preuves de session | Équipe frontend | 2026-10-23-admin-dashboard-theme | Composer le S officiel agrandi dans `ticket.png` et `draws.png`, sans le redessiner et sans étoile | QA et revue indépendante acceptées sur les hashes courants; format PNG RGBA 96x96 et lisibilité vérifiés à 24/96 px | verified | 2026-10-23 |
| QJ-004 | 2026-11-19 | revue architecture Skkup 1.0 | conception | medium | modules NestJS Auth/Realtime | `AuthModule` et `RealtimeModule` se référençaient mutuellement via `forwardRef`, ce qui couplait leurs frontières de module et compliquait leur composition indépendante | `backend/src/auth/auth.module.ts`, `backend/src/realtime/realtime.module.ts` et implémentation documentée dans [`ADR-017`](../design/adr-017-auth-realtime-module-boundary.md) | Backend / Concepteur | architecture-docs-cleanup-2026-11-19 | Correction ciblée implémentée localement selon la portée minimale d'ADR-017 : `AuthRuntimeModule` partage la configuration JWT et l'unique provider de révocation, sans cycle `forwardRef` | QA : 5 suites/40 tests PASS, `typecheck` et `build` PASS; composition Nest sans base ni socket; revue indépendante PASS. `design-readiness` global reste `review`, sans approbation globale; garder l'entrée `in-progress` jusqu'à PR et fusion dans `dev` | in-progress | |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Note de preuves QA ciblées — 18 novembre 2026

Sur le worktree à HEAD `d3679cac73630e0e61ad840ac503952290e3e93f`, cinq suites E2E backend isolées ont réussi avec la commande `bash backend/scripts/test-isolated-e2e-docker.sh <suite-key>` : `auth-lifecycle` (1/1, run `skkup-e2e-auth-lifecycle-20261118211549-46299-5733`), `extension-pairing` (1/1, `skkup-e2e-extension-pairing-20261118211611-46941-12481`), `watch-session-heartbeat` (2/2, `skkup-e2e-watch-session-heartbeat-20261118211626-47377-4381`), `daily-checkin` (1/1, `skkup-e2e-daily-checkin-20261118211641-47965-32567`) et `raffle-admin-draw` (3/3, `skkup-e2e-raffle-admin-draw-20261118211702-48469-25318`). Chaque exécution a terminé avec code 0 et appliqué 12 migrations. Les sorties confirment PostgreSQL tmpfs sur réseau Docker interne, comptes synthétiques et teardown des conteneurs, réseau, volumes et images. Aucun rapport brut des E2E n'est conservé.

US-001 a également un smoke Playwright desktop frais sur ce HEAD: depuis `frontend/`, la spec `e2e/homepage-destinations.spec.ts` a réussi 1/1 en 3 secondes sur la vitrine principale, sans dépendre du backend. La commande a utilisé `QA_PORT=3917`. L'artefact conservé est [`us001-playwright-last-run.json`](evidence/p0-e2e-2026-11-18/us001-playwright-last-run.json), SHA-256 `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903`. Une tentative préalable sans escalade s'est arrêtée avant le test avec `listen EPERM 127.0.0.1:3917`.

Ces preuves sont limitées aux cinq parcours backend ciblés et au smoke desktop d'une page vitrine. Elles ne constituent pas une revue juridique, une validation responsive ou une revue navigateur complète et ne ferment aucune story ni gate. Les statuts `needs-review` de la matrice P0 restent inchangés.

## Fiche détaillée obligatoire pour les niveaux élevé et critique

### QJ-001

- Détecté lors de l'initialisation
- Date et contexte : 2026-09-25, initialisation locale
- Catégorie : bug, sécurité, conception, performance, accessibilité, test, documentation ou exploitation
- Gravité et justification : medium, contrôle d'initialisation non exécutable
- Actifs, utilisateurs ou composants affectés : contrôles de l'environnement de développement
- Scénario reproductible : exécuter la prévalidation avec Python 3.9
- Preuves conservées : sortie `ModuleNotFoundError: tomllib`
- Cause racine ou hypothèse : tomllib est natif à partir de Python 3.11
- Correction choisie et alternatives écartées : contrôles adaptés à un runtime Python compatible, sans contournement de la porte design
- Tests de non régression : contrôle de sécurité réussi; la prévalidation atteint désormais explicitement la porte `Status: approved`
- Vérification indépendante : revue distincte du correcteur, à exécuter après la correction de la readiness et avant son passage à `review`; preuve attendue dans le rapport qualité correspondant
- Risque résiduel et décision humaine éventuelle : contrôles non certifiés jusqu'à correction

### QJ-002

- Détecté par : QA
- Date et contexte : 2026-10-06, audit des preuves de validation de l'initialisation
- Catégorie : validation et readiness
- Gravité et justification : high, les portes design et audit restent non vérifiées malgré la validation et la livraison désormais prouvées
- Actifs, utilisateurs ou composants affectés : onboarding, conception DASH-V3 et chaîne de livraison
- Scénario reproductible : vérifier les obligations de la passe d'initialisation, puis exécuter la prévalidation et le contrôle de sécurité du dépôt
- Preuves conservées : rapports QA et d'audit de l'initialisation datés du 2026-10-06 et du 2026-10-07
- Cause racine ou hypothèse : les preuves P0, de rétention/export/suppression, de licence média, d'alerting/rollback et de sécurité opérationnelle ne sont pas suffisamment démontrées pour approuver la conception
- Correction choisie et alternatives écartées : preuves et décisions manquantes documentées; livraison onboarding réalisée via les PR #215 et #216; aucune auto-approbation ni preuve simulée
- Tests de non régression : run GitHub `37632019552` réussi 6/6; audit local Docker conservé; la relance backend hors Docker atteint 244/247 avec trois échecs `EPERM` d'écoute réseau, donc le résultat historique 247/247 n'est pas présenté comme reproduit
- Vérification indépendante : Plato et les trois audits spécialisés du 2026-10-07 concluent `REWORK`; nouvelle relecture requise après corrections
- Risque résiduel et décision humaine éventuelle : readiness refusée jusqu'à preuve complète; la décision métier de conformité et l'approbation finale de conception restent explicitement attendues
