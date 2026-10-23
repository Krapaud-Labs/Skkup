---
last_updated: 2026-10-23
owner: backend
status: needs-review
---

# Contrats d interfaces

## Conventions communes

API JSON versionnée, sessions par cookie sécurisé côté viewer et jetons limités côté extension. Les erreurs ont un code stable, les écritures sensibles acceptent une clé d'idempotence et les limites sont imposées côté serveur.

## API, événements et interfaces partagées

| ID | Consommateur | Opération ou événement | Entrée validée | Sortie ou erreur | Autorisation | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | viewer | POST /auth/register | email, pseudo, mot de passe, consentements | compte ou erreur de validation | public | auth |
| API-002 | extension/session | POST /watch-sessions/:id/heartbeat | credential de session ou d'extension, position, état de lecture | acceptation ou rejet | credential autorisé par `WatchSessionCredentialGuard` | `watch-sessions` |
| API-003 | admin | POST /admin/raffles/:id/draw | graine d'exploitant, entropie publique | résultat audité ou blocage | admin | tirage |
| API-004 | viewer V3 | GET /me/dashboard/summary | session authentifiée; l'implémentation utilise `JwtAuthGuard` | profil, visionnage validé, activité et transactions récentes | route et service implémentés; `ViewerGuard`/enforcement explicite `Role.VIEWER` absent, preuve HTTP 401/403 à produire | `me.service` (unitaire; pas de preuve HTTP 401/403) |
| ACT-04 Notifications | viewer | GET /viewer/announcements?cursor=<opaque> | curseur optionnel opaque `(createdAt, id)` | `{ items: [{id, titre, texte}], nextCursor }`, 50 éléments maximum | route implémentée avec `ViewerGuard`; source filtre `actif=true`, sans dates; cycle à trois états non implémenté | specs contrôleur/service et E2E HTTP présentes; non exécutées dans cette revue, E2E mocke le service |

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

## Erreurs, limites et observabilité

Les erreurs renvoient un `code` stable, un message non sensible et un
identifiant de corrélation. Les codes attendus incluent `VALIDATION_ERROR`,
`UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE` et
`INTERNAL_ERROR`. Les réponses d'erreur ne révèlent ni existence de compte,
ni détails SQL, ni secrets.

Les routes d'authentification, heartbeat et administration sont limitées côté
serveur. Les timeouts et retries sont bornés par route; un retry n'est permis
que pour une opération idempotente. Chaque contrat doit conserver un test de
permission, de limite et d'erreur de dépendance avant approbation.

## Notifications viewer - contrat cible

La route `GET /viewer/announcements` et `ViewerGuard` existent dans le code
actuel. Le service applique le curseur `(createdAt, id)`, le tri décroissant
stable et la borne de 50 éléments; il filtre `actif=true` sans filtre de dates
([contrôleur](../../backend/src/announcements/announcements.controller.ts#L35),
[service](../../backend/src/announcements/announcements.service.ts#L44),
[garde](../../backend/src/auth/guards/viewer.guard.ts#L9)). Les sources incluent
des specs contrôleur/service et un E2E HTTP qui couvre 401/200/403, mais le E2E
remplace `AnnouncementsService` et ne prouve pas le chemin DB réel. Les tests
n'ont pas été exécutés dans la revue documentaire actuelle.

Le modèle observé reste `actif: boolean`: aucune preuve de cycle
`DRAFT`/`PUBLISHED`/`ARCHIVED` implémenté n'est établie. Les états et mutations
ci-dessous décrivent la cible produit, conformément à
[`announcement-lifecycle-2026-10-22.md`](announcement-lifecycle-2026-10-22.md).

`GET /viewer/announcements` est protégé par session viewer. La cible de
conception retourne les annonces `status=PUBLISHED` sans filtre de dates et
exclut `DRAFT` et `ARCHIVED`. Le code observé utilise encore `actif=true` et
`actif=false`; il ne satisfait pas encore ce modèle à trois états. La réponse
est bornée à 50 éléments et utilise le curseur
opaque `(createdAt, id)` pour une pagination stable; `nextCursor` vaut `null`
quand il n'y a plus de page. `GET /announcements/active` public reste un
endpoint distinct et ne satisfait pas ce contrat.

Les décisions d'interface associées sont celles d'ADR-011 : viewers
authentifiés uniquement, annonces publiées incluant futures et expirées,
brouillons et archives exclus, rechargement à l'ouverture, modal titre et
texte brut, sans badge, compteur ni état lu/non lu.

La cible admin crée une annonce en `DRAFT` et expose des actions dédiées de
publication, archivage et restauration. L'édition conserve le statut courant.
La restauration reprend le statut pré-archivage s'il est prouvé; sinon elle
revient en `DRAFT` et exige une publication séparée. Le plan de migration,
les exceptions historiques et les preuves attendues sont décrits dans
[`announcement-lifecycle-2026-10-22.md`](announcement-lifecycle-2026-10-22.md).
Modifier une annonce archivée renvoie `409` tant qu'elle n'a pas été restaurée.
Les routes cibles, les cas idempotents et les erreurs `409` sont spécifiés dans
le document du cycle; ils ne sont pas encore tous implémentés.
