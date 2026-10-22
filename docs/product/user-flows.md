# Parcours utilisateur

## Inventaire des parcours

| ID | Déclencheur | Acteur | Résultat attendu | Échecs et reprises | Stories liées |
| --- | --- | --- | --- | --- | --- |
| FLOW-001 | inscription puis visionnage | viewer | points visibles dans dashboard | session, stream ou heartbeat invalide ; reprise par reconnexion | US-002 à US-005 |
| FLOW-002 | organisation d'un tirage | admin | résultat publié et auditable | anomalie bloque la publication | US-006 |
| FLOW-003 | créer puis gérer une annonce | admin, puis viewer | annonce publiée explicitement visible aux viewers; brouillon et archive exclus | transition invalide sans mutation; aucun passage implicite en publication | US-008 |

## Diagramme des parcours critiques

```mermaid
flowchart TD
    A[Vitrine] --> B[Inscription]
    B --> C{Compte et consentements valides ?}
    C -->|Non| D[Corriger le formulaire]
    C -->|Oui| E[Dashboard]
    E --> F[Apparier extension]
    F --> G[Heartbeat signé]
    G --> H{Signal accepté ?}
    H -->|Non| I[Ignorer et journaliser]
    H -->|Oui| J[Calcul idempotent]
    J --> K[Points, streak et tickets]
```

Le parcours couvre l'inscription, l'appariement et le crédit serveur. Le tirage manuel suit une procédure séparée documentée dans le règlement et le back-office.

## Détails par parcours

### FLOW-001

- Préconditions : visiteur éligible, email disponible et documents applicables présentés.
- Étapes nominales : inscription, consentement, connexion, appariement, visionnage, heartbeats, calcul serveur.
- Validations et erreurs : âge cible, session, jeton, cadence, plateforme compatible et plafond quotidien.
- Annulation, reprise et persistance : déconnexion ou heartbeat invalide sans crédit ; reprise depuis l'état serveur.
- Critères de sortie : dashboard mis à jour avec ledger et historique cohérents.

### FLOW-003

- Préconditions : admin autorisé; la spécification cible du cycle est relue.
- Étapes nominales : l'admin crée une annonce en `DRAFT`, peut la modifier en
  brouillon, la publie par une action explicite (`PUBLISHED`), puis peut
  l'archiver (`ARCHIVED`). Le viewer ne reçoit que les annonces publiées.
- Validations et erreurs : la création ne publie jamais implicitement; une
  transition invalide ne modifie pas l'annonce. Les règles détaillées de
  publication, archivage et restauration sont définies dans la
  [conception du cycle](../design/announcement-lifecycle-2026-10-22.md).
- Annulation, reprise et persistance : l'archivage masque l'annonce sans la
  supprimer; une restauration suit l'état antérieur conformément à la
  spécification cible.
- Critères de sortie : `DRAFT` et `ARCHIVED` sont exclus de la liste viewer;
  `PUBLISHED` y est inclus. Ces critères décrivent la cible et ne prouvent pas
  l'implémentation.
---
last_updated: 2026-10-22
---
