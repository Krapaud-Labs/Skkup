# Roadmap et plan de livraison

## Incréments

| Incrément | Objectif | Stories incluses | Dépendances | Risques | Critères de sortie | État |
| --- | --- | --- | --- | --- | --- | --- |
| Conception | règles, contrats et sécurité | US-001 à US-007 | cahier accepté | ambiguïtés métier | docs sans marqueurs | en cours |
| MVP | compte, extension Chrome, points, streak | US-002 à US-005 | conception validée | anti-fraude | tests verts | à venir |
| Tirages | admin, lots, audit | US-006 | MVP | conformité | tirage reproductible | à venir |
| Durcissement | QA, sécurité, accessibilité | toutes | MVP | validations externes | preflight et audits | à venir |
| V1.1 | boutique, Firefox, Opera, affiliation | hors MVP | MVP stable | budget et partenaires | décision séparée | reporté |

## Plan de validation et retour

Valider d'abord localement, puis en environnement de test. Exécuter lint, typecheck, tests et build pour chaque sous-projet. Déployer avec migration sauvegardée, healthchecks, logs et rollback documenté. Les approbations juridique et sécurité restent humaines.

## Écarts de périmètre

La boutique, Firefox, Opera et l'affiliation sont reportés en V1.1 pour limiter le risque et le périmètre du MVP. Le calendrier et le budget restent ouverts.
