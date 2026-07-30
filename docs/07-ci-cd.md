# 07. Intégration continue

## Objectif

Aucun merge sur `dev` ou `main` sans passage vert de la CI. Le pipeline est défini dans `.github/workflows/ci.yml`.

## Déclenchement

- À chaque `push` sur une branche `feature/*`, `fix/*`, `release/*`, `hotfix/*`.
- À chaque `pull_request` ciblant `dev` ou `main`.

## Étapes du pipeline

1. **Install** : installation des dépendances (frontend et backend), avec cache des paquets.
2. **Lint** : ESLint/Prettier sur frontend et backend, échec du job si erreurs de lint.
3. **Typecheck** : `tsc --noEmit` sur chaque projet TypeScript.
4. **Tests** : suites unitaires (et d'intégration une fois disponibles) pour frontend et backend.
5. **Build** : build de production Next.js et build NestJS, puis build des images Docker (sans push) pour valider que les Dockerfiles restent fonctionnels.

## Règles de merge (branches protégées)

- `dev` et `main` sont des branches protégées : aucun push direct, uniquement des pull requests.
- Une pull request ne peut être mergée que si :
  - toutes les étapes de la CI sont vertes,
  - au moins une revue de code approuvée (agent ou humain concerné par le domaine touché : frontend, backend, sécurité),
  - la branche est à jour avec sa cible (rebase ou merge de la cible avant merge final).
- Les hotfix suivent la même règle sur `main`, avec répercussion obligatoire vers `dev` (voir [09-gitflow-contributing.md](09-gitflow-contributing.md)).

## Prochaine étape

Le squelette du workflow (`.github/workflows/ci.yml`) est fourni comme base à compléter dès que la structure réelle des projets frontend/backend existera (scripts `lint`, `test`, `build` définis dans leurs `package.json`).
