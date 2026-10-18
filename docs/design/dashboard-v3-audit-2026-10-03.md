---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Audit de reprise DASH-V3

Date : 3 octobre 2026

## Verdict

La DASH-V3 n'est pas conforme aux maquettes et ne doit pas être considérée
comme livrée. La carte Trello a été clôturée avant la validation complète.

## Écarts constatés

- Le dashboard viewer actuel ne reprend pas la composition de la maquette
  principale : visionnage avec visuel de stream, extension connectée, cartes à
  gratter illustrées, prochains tirages et activité récente.
- Le dashboard admin actuel ne reprend pas la composition complète de la
  maquette : barre d'environnement, indicateurs avec pictogrammes, tableaux
  illustrés de tirages et de lots, annonces, signalements et journal d'audit.
- Les écrans secondaires détaillés ne sont pas prouvés conformes écran par
  écran.
- Les assets et icônes visibles dans les maquettes ne sont pas tous intégrés
  fidèlement.
- Les parcours et actions de tous les liens ne sont pas validés manuellement
  sur desktop et mobile.
- La checklist historique Trello contient encore 21 éléments incomplets.

## Références à contrôler

- docs/design/skkup-dashboard-references/dashboard-viewer-principal.png
- docs/design/skkup-dashboard-references/dashboard-admin-principal.png
- docs/design/skkup-dashboard-references/ecrans-secondaires-viewer.png
- docs/design/skkup-dashboard-references/ecrans-secondaires-admin.png
- Les planches détaillées viewer et admin du même dossier.

## Règle de sortie

La carte ne peut être clôturée qu'après :

1. reconstruction des dashboards et pages secondaires ;
2. implémentation des fonctionnalités et actions réelles ;
3. intégration des assets/icônes ;
4. comparaison navigateur aux largeurs 320, 768 et 1280+ ;
5. tests automatisés et parcours manuels ;
6. fusion dans dev et preuve du déploiement ;
7. comparaison finale documentée, sans écart bloquant.

## Spécialistes requis dans le Goal

La reprise doit être contrôlée par des rôles séparés :

- spécialiste design fidelity et comparaison des maquettes ;
- spécialiste frontend viewer ;
- spécialiste frontend admin ;
- spécialiste backend/API et contrats de données ;
- spécialiste assets, icônes et accessibilité visuelle ;
- spécialiste QA navigateur, responsive et parcours ;
- spécialiste release, Git flow et preuves de livraison.

Aucun rôle ne peut valider seul l'ensemble de la Definition of Done.
