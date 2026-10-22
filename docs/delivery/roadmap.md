# Roadmap et plan de livraison

## Incréments

| Incrément | Objectif | Stories incluses | Dépendances | Risques | Critères de sortie | État |
| --- | --- | --- | --- | --- | --- | --- |
| Conception | règles, contrats et sécurité | US-001 à US-007 | cahier accepté | ambiguïtés métier | docs relus, décisions tracées, audit indépendant accepté | en cours |
| MVP | compte natif, extension Chrome, points et baseline streak confirmée | US-002 à US-005 | conception validée | anti-fraude | tests verts | à venir |
| Annonces du back-office | cycle brouillon, publication explicite et archivage selon la [conception du cycle](../design/announcement-lifecycle-2026-10-22.md) | rattachement aux stories à établir | conception validée | migration et preuves d’implémentation | cycle et permissions vérifiés par tests; critères design encore ouverts | à venir |
| Tirages | admin, lots, audit | US-006 | MVP | conformité | tirage reproductible | à venir |
| Durcissement | QA, sécurité, accessibilité | toutes | MVP | validations externes | preflight et audits | à venir |
| V1.1 | boutique, Firefox, Opera, affiliation | hors MVP | MVP stable | budget et partenaires | décision séparée | reporté |

## Plan de validation et retour

Valider d'abord localement, puis en environnement de test. Exécuter lint, typecheck, tests et build pour chaque sous-projet. Déployer avec migration sauvegardée, healthchecks, logs et rollback documenté. Les approbations juridique et sécurité restent humaines.

## Écarts de périmètre

La boutique, Firefox, Opera et l'affiliation sont reportés en V1.1 pour limiter le risque et le périmètre du MVP. Les paramètres non décidés des récompenses de streak (nature, valeur et probabilités) ainsi que le prix des tickets restent hors MVP. Le rattachement des annonces aux stories, le calendrier et le budget restent à établir; aucune date n’est fixée dans cette roadmap.
---
last_updated: 2026-10-22
---
