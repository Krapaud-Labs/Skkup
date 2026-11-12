---
last_updated: 2026-11-12
owner: backend
status: needs-review
---

# Contrats d interfaces

## Conventions communes

API JSON versionnée, sessions par cookie sécurisé côté viewer et jetons limités côté extension. Les erreurs ont un code stable, les écritures sensibles acceptent une clé d'idempotence et les limites sont imposées côté serveur.

## API, événements et interfaces partagées

| ID                    | Consommateur        | Opération ou événement                    | Entrée validée                                                  | Sortie ou erreur                                                   | Autorisation                                                                                        | Tests                                                                                                             |
| --------------------- | ------------------- | ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API-001               | viewer              | POST /auth/register                       | email, pseudo, mot de passe, consentements                      | compte ou erreur de validation                                     | public                                                                                              | auth                                                                                                              |
| API-002               | extension/session   | POST /watch-sessions/:id/heartbeat        | credential de session ou d'extension, position, état de lecture | session, points crédités et progression autoritaire (source extension) ou rejet | credential autorisé par `WatchSessionCredentialGuard`                                               | `watch-sessions`                                                                                                  |
| API-003               | admin               | POST /admin/raffles/:id/draw              | graine d'exploitant, entropie publique                          | résultat audité ou blocage                                         | admin                                                                                               | tirage                                                                                                            |
| API-004               | dashboard personnel | GET /me/dashboard/summary                 | session JWT authentifiée                                        | profil, visionnage validé, activité et transactions récentes       | `JwtAuthGuard` et throttling; identité bornée à l'utilisateur du JWT, sans `ViewerGuard`            | `MeController` délègue l'identité JWT à `MeService`; cette entrée ne prétend pas prouver le parcours DB complet   |
| ACT-04 Notifications  | compte authentifié  | GET /viewer/announcements?cursor=<opaque> | curseur optionnel opaque `(createdAt, id)`                      | `{ items: [{id, titre, texte}], nextCursor }`, 50 éléments maximum | `JwtAuthGuard` et throttling; sans `ViewerGuard`; filtre `status=PUBLISHED`, sans dates             | les specs HTTP et service doivent être lues avec leur portée; elles ne prouvent pas seules le chemin DB/migration |
| ACT-04b Notifications | compte authentifié  | POST /viewer/announcements/unread-count   | IDs lus uniques, jusqu'à 1 000 par requête                      | compte publié, compte lu et empreinte SHA-256                      | `JwtAuthGuard`, throttling à 60/min; IDs de lecture conservés localement, aucun état stocké serveur | unitaires, HTTP auth/validation et E2E PostgreSQL cycle annonces                                                  |

## Extrait de réponse heartbeat accepté

Extrait des champs de progression de `POST /watch-sessions/:id/heartbeat`;
la réponse complète contient également l'objet de session.

```json
{
  "pointsCredites": 0,
  "progressionVisionnage": {
    "statut": "EN_COURS",
    "secondesValideesJour": 2100,
    "secondesAvantProchainPalier": 1500,
    "pointsProchainCredit": 10
  }
}
```

Pour `POST /watch-sessions/:id/heartbeat`, `progressionVisionnage` est
calculée côté serveur après validation et crédit éventuel du heartbeat. Elle
est `null` pour une source non créditable; un heartbeat refusé ne renvoie pas
de progression. Pour une source créditable, l'objet expose le cumul validé
des sessions d'extension depuis la même limite de journée que celle utilisée
par l'octroi des points (`debutJournee` du backend), le temps restant avant
le prochain seuil horaire qui produira effectivement un nouveau crédit, et
le nombre de points attendu à ce seuil. `pointsProchainCredit` inclut le bonus
horaire du stream courant et le bonus ponctuel du palier de trois heures,
après déduction des points déjà crédités ce jour. L'extension ne doit pas
recalculer ces données depuis la position du lecteur.

Quand aucun seuil futur ne peut plus produire de crédit, l'objet prend la
forme `{"statut":"PLAFOND_ATTEINT","secondesValideesJour":21600,
"secondesAvantProchainPalier":null,"pointsProchainCredit":0}` pour le cas
où les six heures du barème sont atteintes. Si le plafond de 65 points est
atteint avant, `secondesValideesJour` contient le cumul réel à cet instant.
Cet état couvre les deux plafonds. Les champs sont additifs à la réponse de
heartbeat et ne changent pas les règles d'octroi.

## Compatibilité et dépréciation

Les changements incompatibles créent une version d'API. Les clients extension et frontend sont déployés avec compatibilité contrôlée ; aucun retrait sans migration et preuve de non-régression.

### API-004 : résumé dashboard viewer

`GET /me/dashboard/summary` renvoie un agrégat borné à l'utilisateur de la
session. Le champ `visionnage.secondesValidees` provient des sessions de
visionnage validées côté serveur, et ne doit pas être recalculé à partir d'un
temps fourni par le navigateur.

```json
{
  "profil": {
    "id": "user-id",
    "pseudo": "viewer",
    "soldePoints": 42,
    "streakActuel": 3,
    "streakMax": 7,
    "derniereVisiteAt": null
  },
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

## Notifications viewer

La route `GET /viewer/announcements` est protégée par `JwtAuthGuard` et le
throttler, sans `ViewerGuard`; le contrôleur ne limite pas le rôle au seul
viewer. Le service applique le curseur `(createdAt, id)`, le tri décroissant
stable et la borne de 50 éléments; il filtre `status=PUBLISHED` sans filtre de
dates ([contrôleur](../../backend/src/announcements/announcements.controller.ts#L35),
[service](../../backend/src/announcements/announcements.service.ts#L44)).
Les tests HTTP/service doivent être lus dans leur périmètre. L'E2E historique
qui remplace le service ne prouve pas à lui seul l'intégration réelle
base/migration. La route de comptage est, elle, vérifiée dans le test unitaire
du service et dans l'E2E PostgreSQL isolé du cycle d'annonces; la preuve datée
et ses limites sont consignées dans la [matrice P0](../quality/p0-evidence-matrix.md#us-008-cycle-des-annonces).

Le modèle utilise `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`) avec `actif` conservé
comme alias de compatibilité. Les états et mutations ci-dessous décrivent le
contrat produit, conformément à
[`announcement-lifecycle-2026-10-22.md`](announcement-lifecycle-2026-10-22.md).

`GET /viewer/announcements` est protégé par session authentifiée. Il retourne les
annonces `status=PUBLISHED` sans filtre de dates et
exclut `DRAFT` et `ARCHIVED`. La réponse est bornée à 50 éléments et utilise le curseur
opaque `(createdAt, id)` pour une pagination stable; `nextCursor` vaut `null`
quand il n'y a plus de page. `GET /announcements/active` public reste un
endpoint distinct et ne satisfait pas ce contrat.

Les décisions d'interface associées sont celles d'ADR-011 : comptes `VIEWER`
et `ADMIN` authentifiés, annonces publiées incluant futures et expirées,
brouillons et archives exclus, rechargement à l'ouverture et modal titre/texte
brut. `POST /viewer/announcements/unread-count` calcule le nombre non lu à
partir des IDs lus conservés dans le navigateur, sans persister ces IDs côté
serveur. Le badge visuel est plafonné à `9+`; le libellé accessible donne le
nombre exact. Le compteur inclut les publications hors de la page courante.

L'admin crée une annonce en `DRAFT` et dispose d'actions dédiées de
publication, archivage et restauration. L'édition conserve le statut courant.
La restauration reprend le statut pré-archivage s'il est prouvé; pour les
anciennes archives, `previousActiveState=true` permet de reconstruire
`PUBLISHED`. Si l'état antérieur n'est pas reconstructible, elle revient en
`DRAFT` et exige une publication séparée. Le plan de migration,
les exceptions historiques et les preuves attendues sont décrits dans
[`announcement-lifecycle-2026-10-22.md`](announcement-lifecycle-2026-10-22.md).
Modifier une annonce archivée renvoie `409` tant qu'elle n'a pas été restaurée.
Les transitions idempotentes et les erreurs `409` sont décrites dans le
document du cycle. Le endpoint de comptage est limité à 60 requêtes par minute
et accepte des lots de 1 000 IDs au maximum; le calcul est exécuté dans une
transaction `RepeatableRead` et renvoie une empreinte pour détecter les
changements de publications entre lots.
