# 07. Intégration continue

## Objectif

Aucun merge sur `dev` ou `main` sans passage vert de la CI. Le pipeline est défini dans `.github/workflows/ci.yml`.

## Déclenchement

- À chaque `push` sur une branche `feature/*`, `fix/*`, `release/*`, `hotfix/*`.
- À chaque `push` sur `dev`, afin de valider le contenu effectivement intégré et
  de fournir la preuve de validation post-fusion.
- À chaque `pull_request` ciblant `dev` ou `main`.

## Étapes du pipeline

La CI utilise Node.js 26, branche `Current` au moment de sa sélection, ainsi
que les versions majeures actuelles `actions/checkout@v6` et
`actions/setup-node@v6`. `check-latest` force la récupération du dernier
correctif disponible de Node.js 26. Les Dockerfiles utilisent la même version
majeure afin d'éviter un écart entre la CI et les images livrées.

Trois projets Node ont chacun leur job : `frontend/`, `backend/` et
`extension/`. L'extension n'est pas conteneurisée (elle s'exécute dans le
navigateur de l'utilisateur) et ne participe donc pas au build des images
Docker, mais elle passe les mêmes contrôles.

Les jobs applicatifs, les tests E2E et le build Docker sont lancés en parallèle
sur des runners indépendants. Le build Docker ne dépend pas des jobs frontend
ou backend : il valide sa propre chaîne de production, tandis que les jobs
applicatifs restent tous obligatoires avant le merge. Cette organisation réduit
le temps d'attente global sans retirer de contrôle ni publier d'image.

## Runners

Les jobs utilisent temporairement les runners GitHub hébergés avec
`ubuntu-latest`. Cette configuration permet de maintenir la CI disponible
pendant la remise en ligne du runner VPS, sans publier de secret ni activer de
service payant. Le quota GitHub doit être surveillé avant toute consommation
facturée. Le runner Linux VPS reste le plan de bascule prévu si GitHub demande
une licence ou si le quota gratuit est épuisé.

1. **Install** : installation des dépendances (frontend, backend, extension), avec cache des paquets.
2. **Lint** : ESLint/Prettier sur chaque projet, échec du job si erreurs de lint.
3. **Typecheck** : `tsc --noEmit` sur chaque projet TypeScript.
4. **Tests** : suites unitaires (et d'intégration une fois disponibles) pour chaque projet.
5. **Build** : build de production Next.js, build NestJS et paquet MV3 de l'extension, puis build des images Docker (sans push) pour valider que les Dockerfiles restent fonctionnels.

## Limite actuelle : protection technique non activée

Le dépôt est privé sur un plan GitHub gratuit, qui ne permet pas d'activer
les règles de protection de branche (GitHub renvoie une erreur demandant un
plan payant ou un dépôt public). En attendant un éventuel changement de
plan, les règles ci-dessous sont appliquées par discipline d'équipe, pas par
un blocage technique de GitHub : chaque agent et contributeur doit s'y tenir
volontairement.

Le déploiement Dokploy est configuré hors de ce dépôt. La CI ne publie pas
d'image et ne déclenche pas elle-même Dokploy ; l'existence d'un redéploiement
automatique après une mise à jour de `dev` doit donc être vérifiée dans le
tableau de bord Dokploy et dans les journaux du VPS.

## Règles de merge (branches protégées)

- `dev` et `main` sont des branches protégées : aucun push direct, uniquement des pull requests.
- Une pull request ne peut être mergée que si :
  - toutes les étapes de la CI sont vertes,
  - au moins une revue de code approuvée (agent ou humain concerné par le domaine touché : frontend, backend, sécurité),
  - la branche est à jour avec sa cible (rebase ou merge de la cible avant merge final).
- Les hotfix suivent la même règle sur `main`, avec répercussion obligatoire vers `dev` (voir [09-gitflow-contributing.md](09-gitflow-contributing.md)).

## Prochaine étape

Activer les règles de protection GitHub dès que le plan du dépôt le permet,
puis ajouter le déploiement automatisé après validation du premier
environnement de production.
---
last_updated: 2026-09-25
---
