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

## Règle de synchronisation en direct

Ce document est la source versionnée du tableau. Chaque carte possède un identifiant stable, un objectif, un périmètre, des dépendances, des critères d acceptation, une estimation, un responsable, une preuve attendue et un lien vers le work item. Le Coordinateur met à jour ce document avant toute création ou modification du tableau externe.

Trello est synchronisé au fil du travail et non par lots. Après chaque début,
validation, commit, résultat CI, blocage, déblocage ou changement de colonne,
le Coordinateur met à jour la carte, la relit directement et confirme la
prochaine action avant de poursuivre. Une checklist n'est cochée qu'après sa
preuve et une seule case est synchronisée par événement.

## Listes du tableau

Les noms de listes sont contrôlés exactement. `Ready` n’est pas une liste
valide pour ce tableau et ne doit pas être utilisé comme alias. Le tableau
utilise six colonnes principales ; un blocage est porté par une étiquette et
la description de la carte, pas par une colonne dédiée.

1. Backlog validé
2. À concevoir
3. À développer
4. En développement
5. Revue
6. Terminé

## Cartes détaillées

| ID | Liste | Feature | Titre | Description détaillée | Dépendances | Critères d acceptation | Preuve | Responsable | Estimation | Priorité |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CARD-001 | À concevoir | Conception | Finaliser les règles MVP | Valider les règles de compte, points, streak, extension et tirage ; documenter les décisions ouvertes et les critères vérifiables | cahier accepté | documents de conception relus, décisions ouvertes listées, work item et preuve associés | dossier docs, ADR et journal qualité | Mickael MUR | 2 j | High |
| CARD-002 | En développement | Internationalisation | Internationaliser le site et l’extension (FR/EN) | Localiser le site, le dashboard, l’administration et l’extension en français et en anglais, avec fallback, accessibilité, documentation et validations reproductibles | provider FR/EN, CI, revue juridique, accès Trello | traductions FR/EN intégrées, erreurs et états vides couverts, tests et builds verts, revue juridique des contenus légaux, checklist et preuve synchronisées | branche `feature/i18n-complete`, commits `5909ac0`, `f7c3bef`, `5a69765` et précédents, `docs/13-internationalisation.md` | Mickael MUR | à estimer | High |
| CARD-003 | À concevoir | UX / Frontend | Améliorer l’UX des formulaires et des contraintes de mot de passe | Afficher les contraintes du mot de passe en temps réel, gérer la confirmation, les erreurs, les états de chargement et les retours accessibles en FR/EN sur desktop et mobile | contrat d’authentification, validation backend, i18n, composants de formulaire | contraintes visibles avant saisie, validation temps réel, erreurs contextualisées, accessibilité clavier/lecteur d’écran/contraste, responsive, tests et documentation prouvés | carte Trello `1OWb607A`, description et checklist `Definition of Done - UX formulaires` relues le 2026-09-26 | Mickael MUR | à estimer | High |

### Audit de conformité du tableau

- Les listes `Ready`, `Inbox`, `In Progress`, `Blocked`, `Review`, `Archived` et
  `V1.1 (post-lancement)` sont non conformes ou auxiliaires et ne doivent pas
  rester comme colonnes principales.
- Les cartes bloquées restent dans leur colonne de travail et reçoivent
  l’étiquette `Bloqué` ainsi qu’un blocage explicite dans leur description.
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
last_updated: 2026-09-26
---
