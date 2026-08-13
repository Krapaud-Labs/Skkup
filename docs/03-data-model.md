# 03. Modèle de données

Ce document décrit les entités principales. Le schéma Prisma définitif sera écrit par l'agent backend lors du passage en implémentation ; ce fichier fixe le contrat conceptuel à respecter. Le schéma réellement implémenté se trouve dans `backend/prisma/schema.prisma`.

## Diagramme entité-relation

```mermaid
erDiagram
    USER ||--o{ LINKED_PLATFORM_ACCOUNT : "lie"
    USER ||--o{ WATCH_SESSION : "regarde"
    USER ||--o{ POINTS_TRANSACTION : "gagne"
    USER ||--o{ RAFFLE_TICKET : "possede"
    USER ||--o{ SCRATCH_CARD : "recoit"
    USER ||--o{ ANNOUNCEMENT : "publie (admin)"

    WATCH_SESSION ||--o{ POINTS_TRANSACTION : "credite"

    RAFFLE ||--o{ RAFFLE_LOT : "propose"
    RAFFLE ||--o{ RAFFLE_TICKET : "recoit"
    RAFFLE ||--o{ RAFFLE_WINNER : "designe"

    RAFFLE_LOT ||--o| RAFFLE_WINNER : "attribue"
    RAFFLE_TICKET ||--o| RAFFLE_WINNER : "gagne"

    USER {
        string id
        string email
        int soldePoints
        int streakActuel
    }
    LINKED_PLATFORM_ACCOUNT {
        string id
        string platform
        string externalAccountId
    }
    WATCH_SESSION {
        string id
        string platform
        string source
        int dureeValideeSecondes
        string statut
    }
    POINTS_TRANSACTION {
        string id
        string type
        int montant
    }
    RAFFLE {
        string id
        string titre
        string statut
        string graineAleatoire
    }
    RAFFLE_LOT {
        string id
        string nom
        decimal valeurEstimee
    }
    RAFFLE_TICKET {
        string id
        datetime createdAt
    }
    RAFFLE_WINNER {
        string id
        datetime notifieAt
    }
    SCRATCH_CARD {
        string id
        int streakPalier
        boolean grattee
    }
    ANNOUNCEMENT {
        string id
        string titre
        boolean actif
    }
    STREAM {
        string id
        string plateforme
        string identifiantChaine
        boolean actif
    }
```

## Entités principales

### User

- id, email, mot de passe (hash), pseudo, date de création
- streak_actuel, streak_max, derniere_visite_at
- solde_points

### LinkedPlatformAccount

- id, user_id, plateforme (twitch, youtube, facebook)
- identifiant externe, token OAuth chiffré, date de liaison

### WatchSession

- id, user_id, plateforme, identifiant du stream
- debut_at, dernier_heartbeat_at, duree_validee_secondes
- statut (en_cours, terminee, invalidee)
- dernier_intervalle_secondes, intervalles_identiques_consecutifs :
  champs anti-fraude, utilisés pour détecter des heartbeats envoyés à un
  intervalle rigoureusement identique (signature d'un script), voir
  [05-security.md](05-security.md).

### Stream

- id, plateforme (twitch, youtube, facebook), identifiant de la chaîne,
  nom affiché, actif (booléen), created_at
- Catalogue des streams partenaires proposés sur le site, servi par
  `GET /streams`. En V1.0 il est renseigné manuellement (seed puis
  back-office administrateur) : la récupération automatique des lives via
  les API des plateformes suppose les intégrations OAuth, prévues plus
  tard. Le drapeau `actif` permet de retirer une chaîne de l'affichage
  sans supprimer son historique.

### PointsTransaction

- id, user_id, type (visite_quotidienne, watch_time, carte_a_gratter, ajustement_admin)
- montant, reference (par exemple watch_session_id), created_at

### Raffle (tirage au sort)

- id, titre, description, date_ouverture, date_tirage
- statut (ouvert, cloture, tire)
- graine_aleatoire, resultat_publie_at

### RaffleLot (lot)

- id, raffle_id, nom, valeur_estimee, quantite, fournisseur

### RaffleTicket

- id, raffle_id, user_id, created_at
- En V1.0, un ticket provient uniquement d'un gain de `ScratchCard` (pas de
  conversion directe de points, voir [01-features.md](01-features.md)).

### RaffleWinner

- id, raffle_id, lot_id, ticket_id, user_id, notifie_at

### ScratchCard (carte à gratter)

- id, user_id, streak_palier (palier de streak ayant débloqué la carte)
- grattee (booléen), gain_type, gain_montant, created_at, grattee_at

### Announcement

- id, titre, texte, actif (booléen), debut_at, fin_at, created_by (admin), created_at

## Contraintes clés à respecter

- Toute variation de `solde_points` doit passer par une `PointsTransaction`
  (source de vérité auditable, pas de mise à jour directe du solde).
- Une `WatchSession` ne peut créditer de points qu'après validation serveur
  des heartbeats (cf. [02-architecture.md](02-architecture.md)).
- En V1.0, un `RaffleTicket` n'est créé qu'à la suite du grattage réussi
  d'une `ScratchCard` (transaction atomique liant les deux). La conversion
  directe de points en ticket revient en V1.1 (voir
  [01-features.md](01-features.md)).
- Le tirage (`Raffle.graine_aleatoire` et algorithme) doit être journalisé
  pour permettre un audit indépendant, conformément à
  [10-legal-compliance.md](10-legal-compliance.md).
