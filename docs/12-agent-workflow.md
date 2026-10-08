# Fonctionnement agentic du projet Skkup

Ce document explique comment présenter l'organisation agentic du projet à une
personne qui découvre le dépôt. Il décrit les fichiers, les rôles, le circuit
d'une demande et les limites du système.

## Vue d'ensemble

Une demande envoyée dans le chat est reçue par l'agent principal du runtime
Codex. Cet agent analyse la demande, lit les règles du dépôt, détermine le
périmètre et décide s'il peut travailler seul ou s'il doit déléguer une partie
du travail à un agent spécialisé.

```text
Demande utilisateur
        |
        v
Agent principal Codex
        |
        +--> coordinateur : périmètre, dépendances et ordre
        +--> concepteur   : architecture et contrats
        +--> backend      : API, données et services
        +--> frontend     : interface et extension
        +--> security     : revue indépendante et risques
        +--> auditor      : contrôle final avant merge
        |
        v
Tests, CI, PR, merge et mise à jour Trello
```

Le script `.codex/scripts/preflight.sh` ne déclenche pas cette chaîne. Il
s'agit d'un contrôle préalable qui peut être lancé manuellement ou branché
ultérieurement à une CI.

Les hooks de cycle de vie calculent toujours la racine du dépôt avec un bloc
conditionnel explicite. Cette précaution évite qu'une combinaison `||` et `&&`
ne concatène deux chemins sous `set -u`, ce qui faisait échouer le hook de
clôture avant l'exécution de sa garde. Le test local de référence est :

```bash
bash -n .codex/hooks/hook-runtime.sh .codex/hooks/stop.sh
printf '{}' | bash .codex/hooks/stop.sh
```

## Initialiser ou reprendre le kit

Depuis un dépôt contenant la nouvelle structure `.codex/`, lancer :

```bash
bash .codex/scripts/init-project.sh --updates off
```

L'initialisation est idempotente : elle crée seulement les éléments manquants,
prépare les répertoires `decisions/`, `evaluations/`, `metrics/`, `reports/`
et `work-items/`, installe le hook Git local et construit un inventaire du
projet. Elle crée aussi `PROJECT-BRIEF.md` et `project-profile.toml` depuis
leurs modèles lorsqu'ils n'existent pas. Un inventaire déjà présent n'est
jamais écrasé.

Le mode `--updates off` n'ajoute pas le workflow de mise à jour du starter kit.
Les modes `--updates pr` et `--updates ask` permettent respectivement de
l'activer directement ou de choisir au lancement. Après l'initialisation,
compléter le cahier des charges, le faire passer à `accepted`, puis appliquer
`project-onboarding` avant toute implémentation.

## Fichiers de référence

### `AGENTS.md`

Règles communes à tous les agents du dépôt :

- contexte minimal à lire avant une tâche ;
- périmètre de fichiers ;
- respect des contrats ;
- validations obligatoires ;
- règles Git et sécurité ;
- format des rapports ;
- conditions d'arrêt et de blocage.

Ce fichier est la règle de gouvernance du projet. Il ne configure pas un modèle
particulier.

### `.codex/agents/*.toml`

Chaque fichier TOML décrit un agent spécialisé. Il contient principalement :

- `name` : identifiant du rôle ;
- `description` : responsabilité principale ;
- `model` : modèle recommandé ;
- `reasoning_effort` : niveau de raisonnement ;
- `model_profile` : profil de modèle choisi par la politique du kit ;
- `skills`, `must_read`, `must_produce` et `forbidden` : contrat opérationnel
  du rôle.

| Fichier | Responsabilité |
| --- | --- |
| `coordinateur.toml` | Planifier, répartir les lots et éviter les chevauchements. |
| `concepteur.toml` | Maintenir l'architecture, les décisions et les contrats. |
| `backend.toml` | Implémenter l'API NestJS, Prisma, PostgreSQL, Redis, BullMQ et Socket.io. |
| `frontend.toml` | Implémenter Next.js, le design system et l'extension. |
| `cybersecurite.toml` | Auditer l'authentification, l'anti-fraude, les permissions et l'infrastructure. |
| `auditeur.toml` | Vérifier le diff, la CI, la documentation, les secrets et la Definition of Done. |

Les fichiers TOML sont la configuration des rôles Codex. Ils ne sont pas des
programmes exécutables et ne lancent pas directement les agents.

### `.codex/scripts/preflight.sh`

Contrôle préalable manuel. Il vérifie notamment :

- l'état Git et le delta par rapport à `origin/dev` ;
- les secrets ou credentials ajoutés dans le diff ;
- les tirets cadratins interdits par le projet ;
- la présence et la validité des champs essentiels des fichiers TOML ;
- facultativement, la PR et un sign-off Security associé au SHA.

Commande :

```bash
bash .codex/scripts/preflight.sh
```

Dans l'état actuel du dépôt, aucun workflow automatique ne l'appelle. Il ne
faut donc pas le présenter comme le déclencheur de l'agentic.

### `.codex/scripts/record-eval.sh`

Outil de traçabilité des évaluations d'agents. Il enregistre l'agent, la tâche,
le verdict, le SHA, le nombre de tours, la durée et éventuellement une
estimation de tokens dans un fichier temporaire local.

### `.codex/evaluations/evaluation.csv` et `.codex/evaluations/REPORT-TEMPLATE.md`

Ces fichiers définissent le format des évaluations utilisées pour mesurer la
qualité et la fiabilité des agents. Ils ne déclenchent pas non plus un agent.

## Documents utilisés par les agents

- `docs/02-architecture.md` : architecture globale ;
- `docs/04-api-contract.md` : contrat entre backend, frontend et extension ;
- `docs/05-security.md` : exigences et gate de sécurité ;
- `docs/07-ci-cd.md` : pipeline et conditions de livraison ;
- `docs/08-docker-infra.md` : infrastructure et déploiement ;
- `docs/09-gitflow-contributing.md` : branches, commits et pull requests ;
- `docs/12-agent-workflow.md` : ce fonctionnement inter-agents.

Le contrat API fait foi entre les composants. Une ambiguïté de contrat doit
être remontée au concepteur avant l'implémentation.

## Déroulement d'une tâche

### 1. Cadrage

L'agent principal identifie l'objectif, les fichiers concernés, la carte
Trello associée et le critère de succès. Le coordinateur vérifie les
dépendances et s'assure qu'une seule carte active est traitée à la fois.

### 2. Conception

Si la tâche modifie l'architecture, le modèle de données ou un contrat, le
concepteur documente la décision avant que les agents applicatifs ne dépendent
de cette décision.

### 3. Implémentation

Le backend intervient avant le frontend lorsqu'un contrat ou une donnée doit
être créé. Le frontend consomme ensuite le contrat validé. Chaque agent reste
dans son périmètre de fichiers.

### 4. Revue sécurité

Security intervient obligatoirement avant un merge lorsque la tâche touche
l'authentification, les permissions, les WebSockets, l'extension, Docker, le
reverse proxy, les données sensibles ou les règles métier. Le rapport indique
la sévérité, le scénario, le fichier et le correctif attendu.

### 5. Validation

Selon le périmètre, les agents exécutent lint, typecheck, tests ciblés, suite
complète, build, `git diff --check` et les contrôles Docker ou CI nécessaires.
Une correction détectée pendant la validation est traitée avant la fin de la
tâche.

### 6. Git et livraison

Le travail est réalisé sur une branche issue de `dev`, avec des commits
Conventional Commits. Une PR rassemble le diff, les validations, la
documentation et les sign-offs requis. Le merge intervient seulement lorsque
la CI est verte et que l'audit Security est accepté.

### 7. Trello

Trello suit l'état produit réel :

1. la carte passe de `Backlog` à `À faire`, puis `En cours` ;
2. la checklist Definition of Done est cochée au fur et à mesure des preuves ;
3. la carte passe en `Revue` lorsque la PR est prête ;
4. elle passe en `Terminé` après le merge et la vérification finale.

Tableau de référence :
<https://trello.com/b/4GCnzk85/skkup>

Une nouvelle tâche imprévue doit être suivie par une carte séparée, avec sa
propre checklist, plutôt que d'être cachée dans une PR.

## Comment les agents communiquent

La communication ne dépend pas uniquement d'un échange de messages. Elle passe
par plusieurs sources vérifiables :

- instructions communes et documents Markdown ;
- contrats API et décisions d'architecture ;
- retours de tâches du runtime Codex ;
- fichiers partagés du dépôt ;
- commits et diffs Git ;
- commentaires et sign-offs de pull request ;
- résultats de tests et de CI ;
- cartes et checklists Trello.

Chaque agent doit produire un état court avec le verdict, les fichiers, les
validations, les problèmes actionnables et la suite éventuelle.

## Compatibilité avec Claude Code

Les règles de fond peuvent être partagées entre Codex et Claude dans
`AGENTS.md`. En revanche, `.codex/agents/*.toml` est le format de configuration
du système Codex de ce dépôt. Claude Code doit recevoir un adaptateur dans son
format natif, généralement `CLAUDE.md` pour les instructions de projet et sa
configuration MCP pour les outils externes.

Il ne faut donc pas supprimer les TOML pour utiliser Claude. Il faut conserver
les règles communes et adapter uniquement la couche de configuration propre à
l'outil.

## Limites actuelles

- `preflight.sh` est présent mais n'est pas appelé automatiquement par
  un workflow du dépôt ;
- les fichiers TOML décrivent les rôles, mais le runtime Codex reste
  responsable du déclenchement et de la délégation ;
- Trello et la CI fournissent les preuves de suivi et de validation, mais ne
  remplacent pas une décision humaine lorsqu'une autorisation externe est
  requise ;
- aucun agent ne doit inventer un contrat, masquer un échec de test ou cocher
  une étape sans preuve.

## Présentation courte

> Skkup utilise un agent principal qui reçoit la demande, un coordinateur qui
> organise le travail, des agents spécialisés pour l'architecture, le backend,
> le frontend et la sécurité, puis un auditeur qui vérifie la livraison. Les
> agents communiquent par les contrats, les fichiers, Git, la CI et Trello. Les
> fichiers TOML décrivent leurs rôles, tandis que `AGENTS.md` définit les règles
> communes. Le script `agent-preflight.sh` contrôle la préparation, mais ne
> déclenche pas le système agentic.
---
last_updated: 2026-09-25
---
