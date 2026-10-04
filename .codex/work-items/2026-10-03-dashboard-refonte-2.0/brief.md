# 2026-10-03-dashboard-refonte-2.0

## Métadonnées

| Champ | Valeur |
|---|---|
| Statut | in-progress |
| Propriétaire | Mickael MUR |
| Risque | élevé |
| Type | Frontend / UX, refonte structurante |
| Carte | DASH-V3, `https://trello.com/c/Z03yOrOC/94-dash-v3-refonte-premium-compl%C3%A8te-des-dashboards-viewer-et-admin` |

## Objectif

Refondre totalement les dashboards viewer et admin pour une expérience premium, claire et pratique : structure, navigation, contenu, hiérarchie, actions, composants, états et responsive. Supprimer le header global actuel et concevoir une navigation adaptée au contexte. Premium signifie ici une hiérarchie maîtrisée, une densité lisible, des interactions soignées, une identité visuelle cohérente et des retours d'action explicites, pas un simple ajout d'effets décoratifs.

## Hors périmètre

Règles métier, calcul des points, permissions backend, nouvelles fonctionnalités non décidées et migrations irréversibles.

## Definition of Done

- Architecture de l'information et navigation documentées.
- Contenu, actions principales et états UI définis.
- Direction visuelle et composants 2.0 documentés.
- Maquettes ou captures relues.
- Responsive, clavier, contraste et `prefers-reduced-motion` vérifiés.
- Implémentation frontend testée sans régression.
- Relecture indépendante et PR vers `dev`.

## Règle de séquencement

Aucune implémentation produit avant la validation de la conception UX/UI et des maquettes de référence.

## Preuves courantes

- Branche dédiée : `feat/dashboard-v3-secondary-streams`, synchronisée avec son remote.
- Kit : `doctor.sh` réussi, kit local `1.12.98`.
- Validation frontend : Vitest `25 fichiers / 93 tests`, Playwright authentifié `12/12` desktop/mobile, typecheck, lint et build webpack réussis.
- Conception : redesign, wireframes, prototype et plan de migration versionnés; les écarts de fidélité DASH-V3 restent ouverts jusqu’à validation visuelle indépendante.
- Trello : carte DASH-V3 relue à distance dans `En développement`; checklist et livraison restent ouvertes.

Ces preuves couvrent désormais l'implémentation frontend et ses contrôles responsive/clavier. La relecture indépendante a toutefois demandé un rework sur la couverture visuelle, les états métier et la traçabilité; la PR vers `dev` reste interdite avant traitement de ces écarts.
