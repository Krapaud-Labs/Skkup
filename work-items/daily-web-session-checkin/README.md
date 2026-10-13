# Session web quotidienne et visite journalière

## Objectif

Exiger une nouvelle connexion web au changement de journée afin que le bonus
de visite soit accordé uniquement après une présence réelle sur le site.

## Périmètre

- JWT et cookie de session web
- garde d'authentification NestJS
- check-in automatique du dashboard
- documentation backend, frontend et sécurité

Le jeton opaque de l'extension reste indépendant et ne demande pas de nouvel
appariement.

## Preuves locales

- Backend ciblé : 52 tests réussis.
- Tests extension, temps réel et stratégie JWT : 52 tests réussis.
- Typecheck backend réussi.
- Frontend auth, dashboard et lib auth : 38 tests réussis, 6 ignorés selon la
  suite existante.
- Typecheck frontend réussi.

## Livraison

Branche dédiée `fix/daily-web-session-checkin`, PR vers `dev` après les contrôles
locaux et `verify-before-push.sh`.
