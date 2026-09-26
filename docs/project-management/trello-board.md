# Tableau Trello du projet

## Paramétrage

- Nom du tableau : Skkup
- Mode : tableau complet toujours généré ; synchronisation externe si intégration autorisée
- Responsable du tableau : Mickael MUR, owner / project lead
- Dernière synchronisation : 2026-09-25, lecture vérifiée via connecteur Trello
- URL : https://trello.com/b/4GCnzk85/skkup
- Identifiant : ari:cloud:trello::board/workspace/6974b8877e2c8c1b6d6c42f3/6a6b9388b666be175d187aee

## Membres et rôles

| Membre | Rôle projet | Identifiant Trello | Cartes attribuées |
| --- | --- | --- | --- |
| Mickael MUR | owner / project lead | ari:cloud:trello::user/5af43610a7da4311e2a5e0ae | cartes du projet |

## Règle de synchronisation

Ce document est la source versionnée du tableau. Chaque carte possède un identifiant stable, un objectif, un périmètre, des dépendances, des critères d acceptation, une estimation, un responsable, une preuve attendue et un lien vers le work item. Le Coordinateur met à jour ce document avant toute création ou modification du tableau externe.

## Listes du tableau

Les noms de listes sont contrôlés exactement. `Ready` n’est pas une liste
valide pour ce tableau et ne doit pas être utilisé comme alias.

1. Backlog validé
2. Prêt à concevoir
3. Conception en cours
4. Prêt à développer
5. En développement
6. En revue
7. En validation
8. Bloqué
9. Terminé

## Cartes détaillées

| ID | Liste | Feature | Titre | Description détaillée | Dépendances | Critères d acceptation | Preuve | Responsable | Estimation | Priorité |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CARD-001 | Prêt à concevoir | Conception | Finaliser les règles MVP | Valider les règles de compte, points, streak, extension et tirage ; documenter les décisions ouvertes et les critères vérifiables | cahier accepté | documents de conception relus, décisions ouvertes listées, work item et preuve associés | dossier docs, ADR et journal qualité | Mickael MUR | 2 j | High |
| CARD-002 | Bloqué | Internationalisation | Internationaliser le site et l’extension (FR/EN) | Localiser le site, le dashboard, l’administration et l’extension en français et en anglais, avec fallback, accessibilité, documentation et validations reproductibles | provider FR/EN, CI, revue juridique, accès Trello | traductions FR/EN intégrées, erreurs et états vides couverts, tests et builds verts, revue juridique des contenus légaux, checklist et preuve synchronisées | branche `feature/i18n-complete`, commits `429c594` et suivants, `docs/13-internationalisation.md` | Mickael MUR | à estimer | High |

### Audit de conformité du tableau

- La liste `Ready` est non conforme et doit être renommée ou supprimée au profit
  d’une liste autorisée.
- Toute carte doit avoir un identifiant stable, une description, un responsable,
  des critères d’acceptation, une preuve attendue et la checklist Definition of
  Done copiée sur la carte distante.
- `CARD-002` ne peut pas passer en `En revue` ou `Terminé` tant que les tests
  runtime, la revue juridique et la synchronisation Trello ne sont pas prouvés.

### Checklist Definition of Done de chaque carte

Chaque carte doit posséder cette checklist dans Trello. Une checklist globale
dans ce document ne remplace pas sa copie sur la carte distante.

- [ ] Conception et contrat concernés mis à jour
- [ ] Code de la feature terminé sur sa branche dédiée
- [ ] Cas nominal et cas d erreur testés
- [ ] Sécurité et permissions vérifiées
- [ ] Accessibilité et responsive vérifiés si frontend
- [ ] Documentation et journal qualité mis à jour
- [ ] Revue indépendante effectuée
- [ ] Preuve reproductible ajoutée
- [ ] Pull Request validée et prête à fusionner

## Checklist de complétude

- Chaque user story du cahier est liée à une ou plusieurs cartes.
- Chaque carte est assez petite pour une branche et des commits atomiques.
- Les tâches de conception, développement, tests, sécurité, documentation et livraison sont présentes.
- Les dépendances et blocages sont explicites.
- Les critères d acceptation sont vérifiables.
- Les cartes terminées référencent une preuve et un identifiant du journal qualité.
---
last_updated: 2026-09-25
---
