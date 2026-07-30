# 09. Gitflow et contribution

Le détail des règles de contribution vit dans `CONTRIBUTING.md` à la racine du
dépôt ; ce document en donne le résumé fonctionnel pour la documentation.

## Branches

- `main` : production, toujours déployable, protégée.
- `dev` : intégration, branche de base pour toutes les fonctionnalités,
  protégée.
- `feature/<sujet>` : une branche par fonctionnalité, part de `dev`, mergée
  dans `dev` par pull request (exemple : `feature/twitch-oauth`).
- `fix/<sujet>` : correctifs non urgents sur `dev`.
- `release/x.y.z` : stabilisation avant merge de `dev` vers `main`.
- `hotfix/<sujet>` : correctifs urgents partant de `main`, mergés dans `main`
  et répercutés dans `dev`.

## Règles de protection

- Aucun push direct sur `main` ou `dev` : uniquement des pull requests.
- CI verte obligatoire avant tout merge (voir [07-ci-cd.md](07-ci-cd.md)).
- Au moins une revue de code approuvée par un agent ou une personne
  compétente sur le domaine concerné (frontend, backend, sécurité).

## Convention de commits

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
`test:`, `ci:`), avec un scope optionnel précisant le domaine
(`feat(backend): ajoute l'endpoint de tirage`).

## Pull requests

Chaque pull request doit inclure : description du changement, lien vers le
document de spécification concerné, checklist de vérification (tests
passés, documentation mise à jour si besoin, revue sécurité si la zone
touchée est sensible).
