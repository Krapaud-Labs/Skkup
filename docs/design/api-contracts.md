# Contrats d interfaces

## Conventions communes

API JSON versionnée, sessions par cookie sécurisé côté viewer et jetons limités côté extension. Les erreurs ont un code stable, les écritures sensibles acceptent une clé d'idempotence et les limites sont imposées côté serveur.

## API, événements et interfaces partagées

| ID | Consommateur | Opération ou événement | Entrée validée | Sortie ou erreur | Autorisation | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | viewer | POST `/auth/register` | `RegisterDto`: email, pseudo, mot de passe, consentements | HTTP 201 `{ pseudo }`, erreur de validation ou limitation | public; `PostAuthThrottlerGuard`, 5/h | `backend/src/auth/auth.controller.spec.ts`, `backend/src/auth/auth.service.spec.ts` |
| API-002 | viewer ou extension | POST `/watch-sessions/:id/heartbeat` | `HeartbeatDto`, identifiant de session | résultat de heartbeat ou rejet; crédit contrôlé côté service | cookie session ou credential extension; `WatchSessionCredentialGuard`, 4/min | `backend/src/watch-sessions/watch-sessions.service.spec.ts`, `backend/src/watch-sessions/watch-session-credential.guard.spec.ts` |
| API-003 | admin | POST `/admin/raffles/:id/draw` | `DrawRaffleDto`, identifiant de tirage dans l'URL | résultat du tirage ou blocage | `AdminGuard`, limitation 5/h | `backend/src/raffles/raffles.service.spec.ts`, `backend/src/raffles/raffle-draw.spec.ts`, `backend/src/raffles/raffles.controller.spec.ts` |

## Exemple de contrat critique

```json
{
  "heartbeatId": "uuid",
  "accepted": true,
  "creditedSeconds": 60,
  "reason": null
}
```

## Compatibilité et dépréciation

Les changements incompatibles créent une version d'API. Les clients extension et frontend sont déployés avec compatibilité contrôlée ; aucun retrait sans migration et preuve de non-régression.

## Vérification des contrats implémentés

Les trois contrats prioritaires ci-dessus ont été rapprochés des contrôleurs, DTO, guards et tests présents dans `backend/`. Cette comparaison a corrigé deux chemins précédemment inexacts : le heartbeat est sous `/watch-sessions/:id/heartbeat` et le tirage admin sous `/admin/raffles/:id/draw`.

Les codes d'erreur exhaustifs, les réponses d'autorisation par endpoint, la stratégie d'idempotence et la compatibilité versionnée restent à compléter à partir d'une extraction contrôleur/DTO et d'une validation contractuelle dédiée. Aucune compatibilité d'API n'est considérée comme prouvée par ce document seul.
---
last_updated: 2026-09-25
---
