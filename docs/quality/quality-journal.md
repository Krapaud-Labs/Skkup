# Journal qualité, bugs et risques

## Règle de fonctionnement

Ce journal est le registre unique et chronologique des défauts, bugs, vulnérabilités, écarts de conception, régressions, résultats d audit et corrections. Tous les agents concernés lisent le journal avant leur audit et ajoutent ou mettent à jour les entrées dans le même work item. Les rapports spécialisés peuvent détailler une analyse, mais aucune anomalie ne doit exister uniquement dans un rapport isolé.

## Statuts autorisés

`open`, `in-progress`, `fixed`, `verified`, `accepted-risk`, `wont-fix`, `duplicate`, `blocked`.

Une entrée `fixed` n est pas résolue tant qu une preuve de vérification indépendante ne l a pas fait passer à `verified`. Une entrée `accepted-risk` exige une décision humaine identifiée, une échéance de révision et une mesure de réduction du risque.

## Registre principal

| ID | Date | Source | Catégorie | Gravité | Composant | Description et impact | Preuve | Responsable | Work item ou commit | Correction | Vérification | Statut | Date de clôture |
| QJ-001 | 2026-09-25 | initialisation | outillage | medium | scripts Python | preflight et résolution modèle échouent avec Python 3.9 car `tomllib` manque | sortie historique; `security-baseline.sh` repasse désormais | Mickael MUR | initialisation | fournir Python >=3.11 ou compatibilité documentée | security baseline vérifiée; preflight reste bloqué uniquement par la readiness design | in-progress | |
| QJ-002 | 2026-10-06 | QA initialisation | validation/readiness | high | work item onboarding | Les preuves historiques ne démontrent pas la readiness actuelle : audit et delivery restent ouverts, preuves QA authentifiées manquantes | `qa-review-2026-10-06.md`, `independent-audit-2026-10-06.md`, sorties courantes `validate-obligations.sh`, `preflight.sh` et `security-baseline.sh` | Coordinateur | 2026-10-03-initialisation-reprise | produire les preuves navigateur authentifiées, obtenir la relecture indépendante et ouvrir la livraison onboarding | contrôles scripts partiellement corrigés; audit-gate et delivery-gate restent ouverts | in-progress | |
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
- Gravité et justification : high, les portes design, audit, validation et delivery ne sont pas toutes prouvées
- Actifs, utilisateurs ou composants affectés : onboarding, conception DASH-V3 et chaîne de livraison
- Scénario reproductible : `bash .codex/scripts/validate-obligations.sh .codex/work-items/2026-10-03-initialisation-reprise/obligations.tsv`; `bash .codex/scripts/preflight.sh`; `bash .codex/scripts/security-baseline.sh`
- Preuves conservées : `.codex/work-items/2026-10-03-initialisation-reprise/qa-review-2026-10-06.md`
- Cause racine ou hypothèse : corrections documentaires non encore relues indépendamment et preuves QA authentifiées indisponibles
- Correction choisie et alternatives écartées : corrections documentaires et contrôles appliqués; aucune auto-approbation ni preuve simulée
- Tests de non régression : security baseline réussie; suite E2E live explicitement ignorée faute de `QA_EMAIL`/`QA_PASSWORD`; validation globale encore bloquée
- Vérification indépendante : auditeur distinct du rédacteur QA, après corrections
- Risque résiduel et décision humaine éventuelle : readiness refusée jusqu'à preuve complète ; aucune décision humaine ne peut remplacer les contrôles techniques manquants
---
last_updated: 2026-09-25
---
