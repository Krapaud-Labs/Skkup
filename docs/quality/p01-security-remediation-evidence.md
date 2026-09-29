# Preuves de remédiation sécurité P01

Ce document recense les preuves vérifiables de la remédiation sécurité. Il ne contient aucun secret, identifiant sensible ou contenu du rapport confidentiel.

## Corrections présentes dans la branche

- Le check-in quotidien est sérialisé par compte avec un verrou transactionnel PostgreSQL afin d'empêcher un double crédit concurrent des points, du streak ou d'une carte.
- Les URLs d'API utilisées par l'extension imposent HTTPS hors développement local et refusent les identifiants ou fragments dans l'URL.
- La réponse d'appariement de l'extension est validée avant le stockage du jeton.
- Les messages d'erreur API affichés par l'extension sont limités à 500 caractères.
- Les ports locaux de l'override Compose sont liés à `127.0.0.1`.
- La configuration Dokploy ne publie aucun port hôte pour les services de données et utilise un réseau de données interne.
- L'API expose maintenant `GET /health` avec une réponse de liveness en anglais, couvert par un test du contrôleur.
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

## Vérifications externes du 29 septembre 2026

- `skkup.fr` résout vers `72.60.94.171` et répond en HTTPS avec le statut 200.
- `www.skkup.fr` résout vers `skkup.fr`, répond en HTTPS avec le statut 308 et redirige vers `https://skkup.fr/`.
- Le VPS répond sur SSH, HTTP et HTTPS. Dokploy répond localement sur le port 3000 avec le statut 200.
- Les services Docker Dokploy, backend, worker, landing et base de données sont à `1/1`.
- Le pare-feu UFW du VPS est actif avec une politique entrante par défaut en refus et une règle Dokploy 3000 limitée à l'IP source `82.122.123.13`.
- L'interface Hostinger confirme que le pare-feu `Dokploy` est actif avec 7 règles.
- Après redémarrage du service SSH, la connexion avec la clé dédiée fonctionne et le port 22 écoute sur IPv4 et IPv6.
- Le backend déployé répond directement et publiquement à `GET https://api.skkup.fr/health` avec HTTP 200 et `{"status":"ok"}`.
- Le 404 observé avant correction provenait du routage Traefik manquant après une recréation manuelle avec le compose local. Le réseau `dokploy-network` et les routeurs Traefik ont été rétablis sur le déploiement courant, puis revalidés par une réponse HTTP 200. La persistance de cette configuration doit être revalidée lors du prochain déploiement Dokploy.

## Contrôles non prouvés ou dépendants de l'environnement

- La rotation effective des secrets et des identifiants dans Dokploy n'est pas prouvée par des valeurs masquées.
- La validation DNS, HTTPS et santé est prouvée pour `skkup.fr`, `www.skkup.fr` et `api.skkup.fr` par les contrôles ci-dessus. Aucun service d'envoi ou de réception de courriel n'est actuellement utilisé par Skkup.
- La campagne authentifiée dédiée au périmètre V-10 n'est pas prouvée par un rapport reproductible.
- La validation humaine de la conformité informationnelle reste requise.
- L'endpoint `GET /health` est désormais prouvé dans le code et en production sur `api.skkup.fr`. La route `skkup.fr/health` n'est pas un endpoint backend et ne constitue pas le contrôle d'API attendu.
- La preuve de santé est valide pour le déploiement courant. La revalidation après un nouveau déploiement reste ouverte pour confirmer que Dokploy conserve le fichier Compose et le routage attendus.
- `mnesya.app` a échoué lors de la négociation TLS depuis l'environnement de contrôle, tandis que `www.mnesya.app` répond en HTTPS. La correction DNS/TLS de `mnesya.app` reste ouverte.
- Le contrôle MX est non applicable au périmètre actuel : aucun service de messagerie ni fonctionnalité d'envoi ou de réception de courriel n'est déployé par Skkup. Il devra être réévalué si une fonctionnalité email est ajoutée.
- Les limites de débit et le plafond de connexions WebSocket restent locaux au processus et nécessitent une décision d'architecture pour un déploiement multi-réplicas.
- L'expiration ou la révocation d'un JWT déjà utilisé par une socket n'est pas réévaluée pendant sa durée de vie.

Ces contrôles restent ouverts tant qu'une preuve opérationnelle ou humaine correspondante n'est pas disponible.
