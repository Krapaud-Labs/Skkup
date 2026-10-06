# Contrats d interfaces

## Conventions communes

API JSON versionnée, sessions par cookie sécurisé côté viewer et jetons limités côté extension. Les erreurs ont un code stable, les écritures sensibles acceptent une clé d'idempotence et les limites sont imposées côté serveur.

## API, événements et interfaces partagées

| ID | Consommateur | Opération ou événement | Entrée validée | Sortie ou erreur | Autorisation | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | viewer | POST /auth/register | email, pseudo, mot de passe, consentements | compte ou erreur de validation | public | auth |
| API-002 | extension | POST /watch/heartbeats | jeton, stream, timestamp, nonce | acceptation ou rejet | device token | anti-fraude |
| API-003 | admin | POST /admin/draws/:id/run | drawId et confirmation | résultat audité ou blocage | admin | tirage |
| API-004 | viewer V3 | GET /me/dashboard/summary | session cookie | profil, visionnage validé, activité et transactions récentes | viewer authentifié | `me.service` |

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

### API-004 : résumé dashboard viewer

`GET /me/dashboard/summary` renvoie un agrégat borné à l'utilisateur de la
session. Le champ `visionnage.secondesValidees` provient des sessions de
visionnage validées côté serveur, et ne doit pas être recalculé à partir d'un
temps fourni par le navigateur.

```json
{
  "profil": { "id": "user-id", "pseudo": "viewer", "soldePoints": 42,
    "streakActuel": 3, "streakMax": 7, "derniereVisiteAt": null },
  "visionnage": { "secondesValidees": 3660, "sessions": 4 },
  "activite": { "ticketsTirage": 2, "cartesAGratterDisponibles": 1 },
  "transactionsRecentes": []
}
```
---
last_updated: 2026-09-25
---
