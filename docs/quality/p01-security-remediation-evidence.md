# Preuves de remédiation sécurité P01

Ce document recense les preuves vérifiables de la remédiation sécurité. Il ne contient aucun secret, identifiant sensible ou contenu du rapport confidentiel.

## Corrections présentes dans la branche

- Le check-in quotidien est sérialisé par compte avec un verrou transactionnel PostgreSQL afin d'empêcher un double crédit concurrent des points, du streak ou d'une carte.
- Les URLs d'API utilisées par l'extension imposent HTTPS hors développement local et refusent les identifiants ou fragments dans l'URL.
- La réponse d'appariement de l'extension est validée avant le stockage du jeton.
- Les messages d'erreur API affichés par l'extension sont limités à 500 caractères.
- Les ports locaux de l'override Compose sont liés à `127.0.0.1`.
- La configuration Dokploy ne publie aucun port hôte pour les services de données et utilise un réseau de données interne.
- Les cookies de session de production exigent `COOKIE_SECURE=true`.
- La CI cible le runner partagé `self-hosted, Linux, X64, krapaud-vps`. La configuration est présente, mais sa disponibilité opérationnelle n'est pas prouvée actuellement.

## Validations exécutées

- Tests backend ciblés : 18 tests réussis.
- Suite backend : 38 suites et 266 tests réussis.
- TypeScript backend et build NestJS : réussis.
- Frontend : lint, typecheck, 22 suites et 68 tests réussis.
- Extension : lint, typecheck, 10 suites et 59 tests réussis.
- Build de l'extension : réussi.
- CI complète sur le runner VPS : run GitHub Actions 36438280220 réussi sur `85c4c11`, avec les jobs frontend, backend, extension et images Docker réussis. Le commit ultérieur `7147d00` modifie uniquement le déclenchement de la CI et doit être validé lors de la PR finale ou d'un lancement manuel.
- Audits npm frontend, backend et extension : 0 vulnérabilité après mise à niveau et régénération des lockfiles dans Node 26.
- `git diff --check` : réussi.
- `docker compose -f docker-compose.dokploy.yml config --format json` : configuration valide, aucun port hôte pour les services de données, réseau `data` interne et `COOKIE_SECURE=true`.
- La composition locale vérifie les liaisons `127.0.0.1` pour les ports de développement.
- Aucun secret réel n'a été détecté dans les fichiers suivis par Git.

## Contrôles non prouvés ou dépendants de l'environnement

- La rotation effective des secrets et des identifiants dans Dokploy n'est pas prouvée par des valeurs masquées.
- La validation actuelle DNS, HTTPS, santé des services et courriel en production n'est pas prouvée par ce document.
- La campagne authentifiée dédiée au périmètre V-10 n'est pas prouvée par un rapport reproductible.
- La validation humaine de la conformité informationnelle reste requise.
- Les limites de débit et le plafond de connexions WebSocket restent locaux au processus et nécessitent une décision d'architecture pour un déploiement multi-réplicas.
- L'expiration ou la révocation d'un JWT déjà utilisé par une socket n'est pas réévaluée pendant sa durée de vie.

Ces contrôles restent ouverts tant qu'une preuve opérationnelle ou humaine correspondante n'est pas disponible.
