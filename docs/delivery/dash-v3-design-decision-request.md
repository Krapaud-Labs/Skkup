# Décision requise pour le gate Design DASH-V3

Date: 2026-10-11  
Référence: ADR-010  
Carte: DASH-V3

## Constat vérifié

Les écrans viewer et admin utilisent les données réellement exposées par les
contrats API. Les campagnes frontend, QA et auditeur ont validé les états,
actions et responsive déjà implémentés. Certaines références visuelles restent
plus riches que les contrats actuels, notamment pour les médias et métadonnées
éditoriales des tirages et des lots.

## Choix à prendre

### Option A: accepter la baseline contractuelle actuelle

Les écarts de richesse des références sont acceptés pour cette carte. Les
écrans conservent uniquement les champs contractuels, avec états vides ou
fallback explicites lorsque les médias ne sont pas fournis. La carte peut
passer le gate Design après relecture indépendante de cette décision.

### Option B: enrichir les contrats

Ajouter les champs et médias manquants aux contrats backend, puis implémenter,
tester et auditer les écrans enrichis avant toute PR.

## Décision du propriétaire produit

Option A retenue le 2026-10-11 : la baseline contractuelle actuelle est
acceptée pour DASH-V3. Les écrans n'inventent pas de médias ou de métadonnées
absents des contrats API ; les fallbacks et états vides documentés sont la
référence de cette livraison. Les optimisations visuelles réalisées restent
dans cette baseline et ne nécessitent pas d'enrichissement API pour cette
carte.

Le gate Design est ainsi validé pour le périmètre DASH-V3. Un enrichissement
ultérieur des contrats devra faire l'objet d'un work item séparé.
