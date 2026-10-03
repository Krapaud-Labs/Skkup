# Journal qualité, bugs et risques

## Règle de fonctionnement

Ce journal est le registre unique et chronologique des défauts, bugs, vulnérabilités, écarts de conception, régressions, résultats d audit et corrections. Tous les agents concernés lisent le journal avant leur audit et ajoutent ou mettent à jour les entrées dans le même work item. Les rapports spécialisés peuvent détailler une analyse, mais aucune anomalie ne doit exister uniquement dans un rapport isolé.

## Statuts autorisés

`open`, `in-progress`, `fixed`, `verified`, `accepted-risk`, `wont-fix`, `duplicate`, `blocked`.

Une entrée `fixed` n est pas résolue tant qu une preuve de vérification indépendante ne l a pas fait passer à `verified`. Une entrée `accepted-risk` exige une décision humaine identifiée, une échéance de révision et une mesure de réduction du risque.

## Registre principal

| ID | Date | Source | Catégorie | Gravité | Composant | Description et impact | Preuve | Responsable | Work item ou commit | Correction | Vérification | Statut | Date de clôture |
| QJ-001 | 2026-09-25 | initialisation | outillage | medium | scripts Python | preflight et résolution modèle échouaient avec Python 3.9 car `tomllib` manque | sortie initiale `ModuleNotFoundError: tomllib`; relance avec `/Users/krapaud/.local/bin/python3.12` puis échec uniquement sur la porte design | Mickael MUR | initialisation-reprise, correction locale `python.sh` | sélectionner automatiquement un interpréteur compatible `tomllib` | preflight relancé; le contrôle Python passe et atteint la porte design attendue | verified | 2026-10-03 |
| QJ-002 | 2026-10-03 | reprise onboarding | test/environnement | medium | backend | les tests HTTP Jest ne peuvent pas ouvrir leur serveur dans la sandbox (`listen EPERM`), ce qui empêche une validation complète locale | sandbox : `listen EPERM`; environnement autorisé : 39 suites et 275 tests réussis | Coordinateur | 2026-10-03-initialisation-reprise | aucune correction produit appliquée ; exécuter dans un environnement autorisant l'écoute locale | `npm test -- --runInBand` backend réussi hors sandbox | verified | 2026-10-03 |
| QJ-003 | 2026-10-03 | reprise onboarding | build/environnement | medium | frontend | Turbopack échoue lors du build Next.js en tentant de lier un port, y compris hors sandbox | `npm run build` et Turbopack : `Operation not permitted`; `npx next build --webpack` : compilation et génération de 23 pages réussies | Coordinateur | 2026-10-03-initialisation-reprise | aucune modification de configuration appliquée ; conserver le résultat Turbopack ouvert pour décision technique | build Webpack frontend réussi; cause Turbopack isolée | blocked | |
| QJ-004 | 2026-10-03 | preflight | outillage | medium | contrôle de style | le preflight parcourait des artefacts ignorés et des binaires/images, puis échouait sur le caractère de tiret long interdit | sortie initiale puis sortie corrigée; le scanner atteint maintenant la porte réelle `design-readiness` | Coordinateur | 2026-10-03-initialisation-reprise | scanner limité aux fichiers Git suivis et aux contenus textuels; contrôle du statut du cahier corrigé; membre Trello ajouté au profil | preflight rejoué; échec restant uniquement car la conception est `draft` | verified | 2026-10-03 |
| QJ-005 | 2026-10-03 | synchronisation Trello | intégration | low | description carte MVP-001 | la mise à jour complète de la description est refusée au-delà de 2048 caractères par le connecteur | réponse Trello `INVALID_ARGUMENT`, `desc maxLength 2048`; relecture confirme que l'ancienne description est conservée | Coordinateur | 2026-10-03-initialisation-reprise | conserver la description distante sous la limite et garder les preuves détaillées dans le dépôt local | nouvelle synchronisation courte à effectuer si une information distante doit changer | open | |
| QJ-006 | 2026-10-03 | livraison Git | intégration | medium | remote `origin` | la résolution DNS GitHub est intermittente et a retardé la confirmation distante | `git push` réussi : `23a5125..d38cae6`; relecture `ls-remote` suivante temporairement en `Could not resolve host`; refs locales et upstream concordants sur `d38cae6` | Coordinateur | 2026-10-03-initialisation-reprise | aucune; conserver le push normal sans `--no-verify` | push et suivi upstream vérifiés après reprise réseau; nouvelle lecture distante à refaire si nécessaire | verified | 2026-10-03 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Fiche détaillée obligatoire pour les niveaux élevé et critique

### QJ-001

- Détecté par : Codex
- Date et contexte : 2026-09-25, initialisation locale
- Catégorie : bug, sécurité, conception, performance, accessibilité, test, documentation ou exploitation
- Gravité et justification : medium, contrôle d'initialisation non exécutable
- Actifs, utilisateurs ou composants affectés : scripts de kit uniquement
- Scénario reproductible : `bash .codex/scripts/preflight.sh` avec Python 3.9
- Preuves conservées : sortie `ModuleNotFoundError: tomllib`
- Cause racine ou hypothèse : tomllib est natif à partir de Python 3.11
- Correction choisie et alternatives écartées : `python.sh` essaie les interpréteurs disponibles et ne sélectionne que ceux qui importent `tomllib`; aucune dépendance installée
- Tests de non régression : `bash .codex/scripts/python.sh -c 'import sys, tomllib; print(sys.executable)'`; `bash .codex/scripts/preflight.sh` atteint la porte design
- Vérification indépendante : contrôle preflight rejoué le 2026-10-03
- Risque résiduel et décision humaine éventuelle : la conception reste non approuvée; le problème Python est résolu
---
last_updated: 2026-09-25
---
