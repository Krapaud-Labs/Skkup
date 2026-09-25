# Journal qualité, bugs et risques

## Règle de fonctionnement

Ce journal est le registre unique et chronologique des défauts, bugs, vulnérabilités, écarts de conception, régressions, résultats d audit et corrections. Tous les agents concernés lisent le journal avant leur audit et ajoutent ou mettent à jour les entrées dans le même work item. Les rapports spécialisés peuvent détailler une analyse, mais aucune anomalie ne doit exister uniquement dans un rapport isolé.

## Statuts autorisés

`open`, `in-progress`, `fixed`, `verified`, `accepted-risk`, `wont-fix`, `duplicate`, `blocked`.

Une entrée `fixed` n est pas résolue tant qu une preuve de vérification indépendante ne l a pas fait passer à `verified`. Une entrée `accepted-risk` exige une décision humaine identifiée, une échéance de révision et une mesure de réduction du risque.

## Registre principal

| ID | Date | Source | Catégorie | Gravité | Composant | Description et impact | Preuve | Responsable | Work item ou commit | Correction | Vérification | Statut | Date de clôture |
| QJ-001 | 2026-09-25 | initialisation | outillage | medium | scripts Python | preflight et résolution modèle échouent avec Python 3.9 car `tomllib` manque | sortie des scripts | Mickael MUR | initialisation | fournir Python >=3.11 ou compatibilité documentée | à refaire après correction | blocked | |
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
- Correction choisie et alternatives écartées : aucune modification de contournement appliquée
- Tests de non régression : à exécuter après disponibilité Python 3.11+
- Vérification indépendante : à planifier
- Risque résiduel et décision humaine éventuelle : contrôles non certifiés jusqu'à correction
