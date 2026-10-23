# Journal qualité, bugs et risques

## Règle de fonctionnement

Ce journal est le registre unique et chronologique des défauts, bugs, vulnérabilités, écarts de conception, régressions, résultats d audit et corrections. Tous les agents concernés lisent le journal avant leur audit et ajoutent ou mettent à jour les entrées dans le même work item. Les rapports spécialisés peuvent détailler une analyse, mais aucune anomalie ne doit exister uniquement dans un rapport isolé.

## Statuts autorisés

`open`, `in-progress`, `fixed`, `verified`, `accepted-risk`, `wont-fix`, `duplicate`, `blocked`.

Une entrée `fixed` n est pas résolue tant qu une preuve de vérification indépendante ne l a pas fait passer à `verified`. Une entrée `accepted-risk` exige une décision humaine identifiée, une échéance de révision et une mesure de réduction du risque.

## Registre principal

| ID | Date | Source | Catégorie | Gravité | Composant | Description et impact | Preuve | Responsable | Work item ou commit | Correction | Vérification | Statut | Date de clôture |
| QJ-001 | 2026-09-25 | initialisation | outillage | medium | scripts Python | preflight et résolution modèle échouent avec Python 3.9 car `tomllib` manque | sortie historique; `security-baseline.sh` repasse désormais | Mickael MUR | initialisation | fournir Python >=3.11 ou compatibilité documentée | security baseline vérifiée; preflight reste bloqué uniquement par la readiness design | in-progress | |
| QJ-002 | 2026-10-06 | QA initialisation | validation/readiness | high | work item onboarding | Les preuves QA et de livraison sont maintenant présentes, mais la readiness de conception reste refusée par l'audit indépendant à cause de preuves P0, conformité et exploitation manquantes | `qa-review-2026-10-06.md`, `independent-audit-2026-10-07-plato.md`, `independent-audit-2026-10-07-plato-rerun.md`, `specialist-audits-2026-10-07.md`, `evidence/local-validation.md`, runs GitHub `37632019552`, `37634055573` | Coordinateur | 2026-10-03-initialisation-reprise; PR #215 `b1cb523`; PR #216 `193958a`; PR #219 `4693294` | traiter les écarts P0 et de conception, puis faire relire indépendamment la readiness | PR #215 à #219 fusionnées dans `dev`; CI PR #219 6/6 réussie; design-gate `needs-review` et audit-gate `pending` restent ouverts à juste titre | in-progress | |
| QJ-003 | 2026-10-23 | audit indépendant lot dashboard | identité visuelle | medium | icônes PNG ticket/tirages | Les icônes runtime ticket et tirages ne respectaient pas la demande d'utiliser le S officiel plutôt qu'une étoile ou des coutures; le glyphe était difficile à reconnaître à 24 px | `/private/tmp/skkup-admin-theme-20261023/final-worktree-audit.md`; QA `/private/tmp/skkup-admin-theme-20261023/qa-icons-draws-ticket.md`; hashes consignés dans `.codex/RUNTIME-STATE.md` | Frontend | 2026-10-23-admin-dashboard-theme | Composer le S officiel agrandi dans `ticket.png` et `draws.png`, sans le redessiner et sans étoile | QA et revue indépendante acceptées sur les hashes courants; format PNG RGBA 96x96 et lisibilité vérifiés à 24/96 px | verified | 2026-10-23 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Fiche détaillée obligatoire pour les niveaux élevé et critique

### QJ-001

- Détecté par : Codex
- Date et contexte : 2026-09-25, initialisation locale
- Catégorie : bug, sécurité, conception, performance, accessibilité, test, documentation ou exploitation
- Gravité et justification : medium, contrôle d'initialisation non exécutable
- Actifs, utilisateurs ou composants affectés : scripts de kit uniquement
- Scénario reproductible : `bash .codex/scripts/preflight.sh` avec Python 3.9
- Preuves conservées : sortie `ModuleNotFoundError: tomllib`
- Cause racine ou hypothèse : tomllib est natif à partir de Python 3.11
- Correction choisie et alternatives écartées : scripts basculés vers le helper Python du kit, sans contournement de la porte design
- Tests de non régression : `bash .codex/scripts/security-baseline.sh` réussi; `preflight.sh` atteint désormais explicitement la porte `Status: approved`
- Vérification indépendante : auditeur distinct du correcteur, à exécuter après la correction de la readiness et avant son passage à `review`; preuve attendue dans le rapport qualité du work item
- Risque résiduel et décision humaine éventuelle : contrôles non certifiés jusqu'à correction

### QJ-002

- Détecté par : QA
- Date et contexte : 2026-10-06, audit des preuves de validation de l'initialisation
- Catégorie : validation et readiness
- Gravité et justification : high, les portes design et audit restent non vérifiées malgré la validation et la livraison désormais prouvées
- Actifs, utilisateurs ou composants affectés : onboarding, conception DASH-V3 et chaîne de livraison
- Scénario reproductible : `bash .codex/scripts/validate-obligations.sh .codex/work-items/2026-10-03-initialisation-reprise/obligations.tsv`; `bash .codex/scripts/preflight.sh`; `bash .codex/scripts/security-baseline.sh`
- Preuves conservées : `.codex/work-items/2026-10-03-initialisation-reprise/qa-review-2026-10-06.md`, `.codex/work-items/2026-10-03-initialisation-reprise/independent-audit-2026-10-07-plato.md`, `.codex/work-items/2026-10-03-initialisation-reprise/specialist-audits-2026-10-07.md`
- Cause racine ou hypothèse : les preuves P0, de rétention/export/suppression, de licence média, d'alerting/rollback et de sécurité opérationnelle ne sont pas suffisamment démontrées pour approuver la conception
- Correction choisie et alternatives écartées : preuves et décisions manquantes documentées; livraison onboarding réalisée via les PR #215 et #216; aucune auto-approbation ni preuve simulée
- Tests de non régression : run GitHub `37632019552` réussi 6/6; audit local Docker conservé; la relance backend hors Docker atteint 244/247 avec trois échecs `EPERM` d'écoute réseau, donc le résultat historique 247/247 n'est pas présenté comme reproduit
- Vérification indépendante : Plato et les trois audits spécialisés du 2026-10-07 concluent `REWORK`; nouvelle relecture requise après corrections
- Risque résiduel et décision humaine éventuelle : readiness refusée jusqu'à preuve complète; la décision métier de conformité et l'approbation finale de conception restent explicitement attendues
---
last_updated: 2026-10-07
---
