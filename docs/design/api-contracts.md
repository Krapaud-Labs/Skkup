# Contrats d interfaces

## Conventions communes

API JSON versionnée, sessions par cookie sécurisé côté viewer et jetons limités côté extension. Les erreurs ont un code stable, les écritures sensibles acceptent une clé d'idempotence et les limites sont imposées côté serveur.

## API, événements et interfaces partagées

| ID | Consommateur | Opération ou événement | Entrée validée | Sortie ou erreur | Autorisation | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | viewer | POST /auth/register | email, pseudo, mot de passe, consentements | compte ou erreur de validation | public | auth |
| API-002 | extension | POST /watch/heartbeats | jeton, stream, timestamp, nonce | acceptation ou rejet | device token | anti-fraude |
| API-003 | admin | POST /admin/draws/:id/run | drawId et confirmation | résultat audité ou blocage | admin | tirage |

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

Les contrats ci-dessus doivent être comparés aux contrôleurs, DTO, guards et tests réellement présents dans `backend/`, puis complétés avec les codes d'erreur, les limites, l'idempotence et les réponses d'autorisation observées. Aucune compatibilité d'API n'est considérée comme prouvée par ce document seul.
---
last_updated: 2026-09-25
---
