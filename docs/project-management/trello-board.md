---
last_updated: 2026-10-18
---

# Tableau Trello du projet

> Archive historique : Trello est désactivé depuis le 18 octobre 2026. GitHub Projects est le suivi actif. Les données ci-dessous sont conservées uniquement comme historique et ne doivent plus être synchronisées. Voir [github-project.md](github-project.md).

## Paramétrage

- Nom du tableau : Skkup
- Mode : tableau complet toujours généré ; synchronisation externe si intégration autorisée
- Responsable du tableau : Mickael MUR, owner / project lead
- Dernière synchronisation : 2026-10-11, écriture puis relecture vérifiées via le connecteur Trello
- URL : [Tableau historique](https://trello.com/b/4GCnzk85/skkup)
- Identifiant : ari:cloud:trello::board/workspace/6974b8877e2c8c1b6d6c42f3/6a6b9388b666be175d187aee
- État de reprise 2026-10-07 : `verified`; tableau, listes, étiquettes, carte et checklist relus à distance après mise à jour.
- Carte d'initialisation : `[MVP-001] Reprendre et livrer l'initialisation Skkup` ; URL : [carte historique](https://trello.com/c/zscUVeIC/91-mvp-001-reprendre-et-livrer-linitialisation-skkup) ; identifiant : `ari:cloud:trello::card/workspace/6974b8877e2c8c1b6d6c42f3/6ac0e6543e2f5b07cf12c568` ; liste : `En développement`.
- Checklist relue : `Initialisation et livraison`, identifiant `ari:cloud:trello::checklist/workspace/6974b8877e2c8c1b6d6c42f3/6ac0e65db3e7f5690a0cc5d3`, 6 éléments terminés; la carte reste ouverte car la conception est en rework.
- Carte DASH-V3 : refonte complète des dashboards viewer/admin ; liste : `En développement` ; labels : `Frontend`, `Feature`.
- Suivi DASH-V3 : maquettes, fonctionnalités, assets, responsive et preuves de livraison sont suivis dans le work item courant.
- Carte MVP-002 : audit page par page, du design aux fonctions ; identifiant : `ari:cloud:trello::card/workspace/6974b8877e2c8c1b6d6c42f3/6acb868e490d56928145771e` ; URL : [carte historique](https://trello.com/c/Ymbxdssr/96-mvp-002-auditer-chaque-page-du-design-aux-fonctions) ; liste : `En développement` ; checklist : `[MVP-002] Audit séquentiel par page` ; 1 élément terminé sur 13.

## Membres et rôles

| Membre | Rôle projet | Identifiant Trello | Cartes attribuées |
| --- | --- | --- | --- |
| Mickael MUR | owner / project lead | ari:cloud:trello::user/5af43610a7da4311e2a5e0ae | cartes du projet |

## Règle de synchronisation

Ce document est la source versionnée du tableau. Chaque carte possède un identifiant stable, un objectif, un périmètre, des dépendances, des critères d acceptation, une estimation, un responsable, une preuve attendue et un lien vers le work item. Le Coordinateur met à jour ce document avant toute création ou modification du tableau externe.

## Listes du tableau

1. Backlog validé (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6b938fa32429d03753e83b`)
2. À concevoir (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6b93923ca5fa509bd3d337`)
3. En développement (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6b93930e329e13983c3d97`)
4. Revue (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6b93955a4829c446c7b5d7`)
5. Terminé (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6b9397660b393096583c82`)
6. Feature Post MVP (`ari:cloud:trello::list/workspace/6974b8877e2c8c1b6d6c42f3/6a6cdb50084b730522ba2e71`)

## Cartes détaillées

| ID | Liste | Feature | Titre | Description détaillée | Dépendances | Critères d acceptation | Preuve | Responsable | Estimation | Priorité |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MVP-001 | À concevoir | Architecture | Reprendre et livrer l'initialisation Skkup | Auditer le kit, Git, la conception, les contrôles et la livraison documentaire | aucune | tableau, contrôles, conception et PR relus | work item `2026-10-03-initialisation-reprise`, commits documentaires `21ab0f1`, `43fcf4c`, `ac8539c`, `50f6432`, `039693c`, `08a9f0e` | Mickael MUR | à estimer | High |
| DASH-V3 | En développement | Frontend / UX | Refonte complète des dashboards premium | Refaire structure, navigation, contenu, états et responsive des dashboards viewer/admin avec une expérience premium | conception UX/UI | audit, maquettes, tests et PR | work item DASH-V3 et preuves écran par écran | Mickael MUR | à estimer | High |
| MVP-002 | En développement | Feature / Frontend / QA | Auditer chaque page, du design aux fonctions | Terminer le design d’une page, puis vérifier ses liens, actions, permissions, états et données avant de passer à la suivante | DASH-V3 livrée dans dev | toutes les pages auditées et preuves relues | carte Trello MVP-002, checklist 1/13, commentaires structurés | Mickael MUR | à estimer | High |

### Checklist Definition of Done de chaque carte

- [ ] Conception et contrat concernés mis à jour
- [ ] Code de la feature terminé sur sa branche dédiée
- [ ] Cas nominal et cas d erreur testés
- [ ] Sécurité et permissions vérifiées
- [ ] Accessibilité et responsive vérifiés si frontend
- [ ] Documentation et journal qualité mis à jour
- [ ] Revue indépendante effectuée
- [ ] Preuve reproductible ajoutée
- [ ] Pull Request validée et prête à fusionner

### État courant de la checklist MVP-001

- [x] Relire le tableau, les listes, les étiquettes et la carte depuis Trello
- [x] Mettre à jour les documents locaux avec les identifiants et URLs observés
- [x] Exécuter et documenter les contrôles locaux
- [x] Faire réaliser l'audit indépendant de conception; résultat `rework`, approbation non acquise
- [x] Vérifier la branche dédiée et les portes pré-push; push de la branche confirmé sur `cc982d5`
- [x] Créer et relire les Pull Requests vers `dev`; livraison onboarding vérifiée, carte non clôturée tant que la conception reste en rework

## Checklist de complétude

- Chaque user story du cahier est liée à une ou plusieurs cartes.
- Chaque carte est assez petite pour une branche et des commits atomiques.
- Les tâches de conception, développement, tests, sécurité, documentation et livraison sont présentes.
- Les dépendances et blocages sont explicites.
- Les critères d acceptation sont vérifiables.
- Les cartes terminées référencent une preuve et un identifiant du journal qualité.
---
last_updated: 2026-10-11
---
