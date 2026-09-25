# Modèle de données

## Classification et cycle de vie

| Donnée ou entité | Sensibilité | Source | Usage | Rétention | Suppression | Responsable |
| --- | --- | --- | --- | --- | --- | --- |
| User, Session | personnelle | formulaire | compte et session | durée légale à définir | suppression/export | produit |
| Heartbeat, DeviceToken | comportementale | extension | validation activité | durée minimale nécessaire | purge documentée | backend |
| PointLedger, Ticket | activité | backend | solde et tirages | historique auditable | selon règlement | produit |
| FraudSignal, AuditLog | sensible | backend/admin | sécurité et traçabilité | durée à valider | accès restreint | sécurité |

## Entités, attributs et règles

| Entité | Attributs clés | Identifiant | Relations | Contraintes et invariants |
| --- | --- | --- | --- | --- |
| User | email, pseudo, hash | userId | sessions, appareils | email unique, hash jamais lisible |
| StreamSession | plateforme, début, fin | sessionId | heartbeats, ledger | durée serveur, pas de doublon |
| PointLedger | delta, source, clé idempotence | ledgerId | user, session | append-only |
| Draw | dates, statut, graine, empreinte | drawId | entries, prizes | figé avant tirage |
| Ticket | type, statut, user | ticketId | user, draw | jamais négatif |

## Diagramme de données

```mermaid
erDiagram
    USER ||--o{ SESSION : owns
    USER ||--o{ DEVICE : pairs
    SESSION ||--o{ HEARTBEAT : receives
    USER ||--o{ POINT_LEDGER : owns
    USER ||--o{ TICKET : receives
    DRAW ||--o{ TICKET : accepts
```

Les noms représentent les agrégats métier ; les attributs définitifs sont ceux du schéma Prisma.

## Migrations, intégrité et sauvegarde

Les migrations Prisma sont versionnées. Toute migration est testée sur une base de validation, sauvegardée avant production et accompagnée d'un plan de rollback documenté.
