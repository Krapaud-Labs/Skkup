# Guide de contribution

## Branches

- `main` : production, toujours déployable. Traitée comme protégée : aucun
  push direct, uniquement des pull requests avec CI verte et revue
  approuvée. Le dépôt étant privé sur un plan GitHub gratuit, cette
  protection n'est pas imposée techniquement par GitHub pour le moment ;
  elle repose sur la discipline de chaque contributeur (voir
  `docs/07-ci-cd.md`).
- `dev` : intégration de toutes les fonctionnalités avant une release.
  Traitée selon les mêmes règles que `main`, avec la même limite actuelle.
- `feature/<sujet>` : une branche par fonctionnalité, créée depuis `dev`.
  Exemples : `feature/twitch-oauth`, `feature/raffle-engine`,
  `feature/design-system-neon`.
- `fix/<sujet>` : correctif non urgent, créé depuis `dev`.
- `release/x.y.z` : branche de stabilisation avant merge de `dev` vers
  `main` (gel des fonctionnalités, corrections de bugs uniquement).
- `hotfix/<sujet>` : correctif urgent créé depuis `main`, mergé dans `main`
  puis répercuté dans `dev` immédiatement après.

## Cycle de vie d'une fonctionnalité

1. Créer la branche `feature/<sujet>` depuis `dev` à jour.
2. Développer et committer avec la convention ci-dessous.
3. Ouvrir une pull request vers `dev` dès que la fonctionnalité est prête,
   et déplacer la carte Trello correspondante vers "Revue".
4. Attendre que la CI passe au vert (voir `docs/07-ci-cd.md`).
5. Obtenir la validation de l'agent cybersécurité : audit de sécurité et
   vérification des tests unitaires, **obligatoires avant tout merge, quelle
   que soit la zone touchée** (voir `docs/05-security.md`, section "Process
   de merge obligatoire"). Pas de merge sans cette validation, même si la CI
   est verte.
6. Obtenir une revue approuvée par un agent ou une personne compétente sur
   le domaine touché (frontend, backend).
7. Merger dans `dev` (merge commit ou squash selon la taille de la
   fonctionnalité), supprimer la branche, et déplacer la carte Trello vers
   "Terminé".

## Convention de commits (Conventional Commits)

Format : `type(scope facultatif): description au présent`.

Types utilisés dans ce projet :

- `feat` : nouvelle fonctionnalité
- `fix` : correction de bug
- `docs` : documentation uniquement
- `refactor` : changement de code sans effet fonctionnel
- `test` : ajout ou modification de tests
- `chore` : tâches d'outillage, dépendances
- `ci` : configuration de l'intégration continue

Exemples : `feat(backend): ajoute l'endpoint de tirage au sort`,
`docs: précise le modèle de données des tickets`.

## Pull requests

Chaque pull request doit contenir :

- une description claire du changement et son lien avec la documentation
  concernée (`docs/`) ;
- une checklist : tests passés, documentation mise à jour si nécessaire,
  audit sécurité et tests unitaires validés par l'agent cybersécurité
  (systématique, pas seulement sur les zones jugées sensibles) ;
- la CI verte avant toute demande de revue.

## Règle générale pour ce projet

Aucun code applicatif n'est ajouté tant que la documentation correspondante
dans `docs/` n'a pas été validée. Les squelettes d'infrastructure (Docker,
CI) peuvent être posés en amont, mais restent au niveau configuration, pas
code métier.
