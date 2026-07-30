# 12. Workflow inter-agents et suivi Trello

Ce document fixe comment les 4 agents (concepteur, frontend, backend,
cybersécurité) doivent travailler ensemble au quotidien, en plus des règles
de [09-gitflow-contributing.md](09-gitflow-contributing.md). Il complète
CONTRIBUTING.md plutôt que de le remplacer.

Board Trello de référence : <https://trello.com/b/4GCnzk85/viewer-rewards>

## Règle générale : le Trello reflète l'état réel du travail

Le board ne doit jamais être figé une fois créé. Chaque agent le tient à
jour au fil du développement, pas seulement au moment du cadrage initial.

1. **Avant de commencer une tâche** : l'agent prend la carte correspondante
   dans "Backlog" (ou la crée si elle n'existe pas encore) et la déplace
   vers "À faire" puis "En cours" dès qu'il démarre réellement le travail.
2. **Pendant le développement** : l'agent coche au fur et à mesure les
   éléments de la checklist "Definition of Done" de la carte, et ajoute un
   commentaire bref si une décision notable a été prise (changement de scope,
   blocage, dépendance découverte).
3. **Quand le travail est prêt à être revu** : l'agent ouvre la pull request
   (voir CONTRIBUTING.md) et déplace la carte vers "Revue".
4. **Après le merge** : la carte passe en "Terminé". Si le travail est
   abandonné ou remplacé, elle est archivée avec une note expliquant
   pourquoi plutôt que supprimée.
5. Si une tâche imprévue apparaît en cours de route (bug découvert,
   sous-tâche non anticipée), l'agent crée une nouvelle carte dans
   "Backlog" avec le bon label de domaine plutôt que de la laisser
   uniquement dans une pull request ou une conversation.

## Rôle renforcé de l'agent cybersécurité avant tout merge

L'agent cybersécurité ne se contente pas d'une revue ponctuelle sur les
zones jugées sensibles : **avant tout merge sur `dev` ou `main`, il doit
systématiquement réaliser un audit de sécurité et vérifier les tests
unitaires**, quelle que soit la carte concernée. Le détail des vérifications
attendues est décrit dans
[05-security.md](05-security.md#process-de-merge-obligatoire).

Concrètement, sur la carte Trello en "Revue" :

- l'agent cybersécurité coche l'item "Audit sécurité et tests unitaires
  validés" de la checklist seulement après avoir réellement exécuté cet
  audit et vérifié que les tests unitaires passent (pas de case cochée par
  anticipation) ;
- si l'audit ou les tests unitaires échouent, la carte repart en "En cours"
  avec un commentaire listant les points bloquants, et la pull request
  reste ouverte jusqu'à correction ;
- une fois validé, l'agent approuve la pull request et seulement alors le
  merge peut avoir lieu.

Ce gate s'ajoute aux règles déjà en place dans
[07-ci-cd.md](07-ci-cd.md) (CI verte obligatoire) : les deux sont requis,
ni l'un ni l'autre ne remplace l'autre.
