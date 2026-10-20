---
last_updated: 2026-10-18
owner: project lead
status: documentation-only
---

# GitHub Project Skkup

## Configuration

- Système de suivi retenu : GitHub Projects.
- Projet : `Skkup`.
- Dépôt : `Krapaud-Labs/Skkup`.
- Décision : Trello désactivé par le responsable le 18 octobre 2026.
- Synchronisation distante : relue dans Chrome le 18 octobre 2026 après la réconciliation de MVP-001.
- URL : [GitHub Project Skkup](https://github.com/orgs/Krapaud-Labs/projects/1)
- Identifiant observé : `1`.
- Vue relue après mise à jour : `Backlog validé` 12 éléments, `En développement` 1 élément, `Done` 79 éléments.
- L'Issue `[MVP-001] Reprendre et livrer l'initialisation Skkup` est `Krapaud-Labs/Skkup#297`, ouverte et placée dans `En développement`.
- Réconciliation effectuée le 18 octobre 2026 : l'Issue #297 a été rouverte, sa description Trello obsolète remplacée par les critères d'initialisation actuels, puis l'élément a été déplacé de `Done` à `En développement`. La conception demeure en revue; l'issue ne doit pas être fermée avant la livraison documentée.
- État relu le 18 octobre 2026 via le connecteur GitHub après le dernier point de contrôle : l'issue #297 est toujours ouverte; sa checklist distingue les documents de suivi réconciliés des validations design, des relectures globales et de la livraison encore ouvertes. Le détail d'état et le diff de branche sont consignés dans son corps distant; aucune fermeture n'a été demandée.
- Approbation hooks : le responsable l'a confirmée explicitement dans le chat le 18 octobre 2026.

## État documentaire de MVP-001 et PR #419 — 2026-10-20

État vérifié dans les rapports indépendants de PR et consigné ici pour le suivi
documentaire; il ne vaut ni approbation ni clôture:

- L'issue [#297](https://github.com/Krapaud-Labs/Skkup/issues/297) est
  `open`. Les deux critères « compléter la conception et relier chaque
  exigence à ses preuves » et « obtenir les relectures indépendantes » restent
  décochés.
- La [PR #419](https://github.com/Krapaud-Labs/Skkup/pull/419) vers `dev` est
  `open`, non fusionnée (`merged=false`). Son head observé est
  `28458cac4eac4cadc9942bcb98adf36f90e4a4dd`; la base `dev` observée est
  `a9a463cc39ebe3a696d8fe01f64db3d8dcd45712`.
- Le run CI `39434954264` a réussi ses 6/6 jobs. Aucun avis GitHub n'est
  enregistré sur la PR. La réussite CI ne remplace ni les revues spécialisées
  acceptées ni la fusion et la vérification du SHA intégré.
- Les rapports indépendants frontend
  (`01a1598f-530c-7120-b21a-929771efc213`), QA
  (`01a1598f-53d0-77e3-9368-9a3e19738c63`) et auditeur
  (`01a1598f-5216-7300-9ee1-1894e85d7548`) ont tous le statut `rework`.
- [`design-readiness.md`](../design/design-readiness.md) reste à
  `Status: review`; ses cases d'audit indépendant accepté et de traitement
  complet des marqueurs restent décochées.

En conséquence, aucune de ces cases d'issue n'est déclarée terminée et #297
reste ouverte. Le snapshot Notifications antérieur du 2026-10-20 est conservé
et explicitement supersédé dans `design-readiness.md` par l'observation locale
plus récente; les limites et écarts de cette dernière restent ouverts.

## Règles de couverture

Chaque Issue doit porter un identifiant stable `MVP-*` ou `POST-MVP-*`, une description détaillée, des critères d'acceptation, une checklist, les preuves attendues, les dépendances et une Definition of Done. Une Issue correspond à une branche et une seule Pull Request finale vers `dev`.

## État vérifié

Le connecteur API GitHub a permis la relecture et la mise à jour de l'Issue; Chrome a permis de déplacer l'élément puis de relire visuellement le Project. La synchronisation est vérifiée pour l'état observé ci-dessus.

## Prochaine action

Relire le Project après chaque changement significatif et compléter les Issues manquantes avec leurs preuves avant toute clôture d'initialisation.
