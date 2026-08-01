# 03. Modèle de données

Ce document décrit les entités principales. Le schéma Prisma définitif sera écrit par l'agent backend lors du passage en implémentation ; ce fichier fixe le contrat conceptuel à respecter.

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

### PointsTransaction

- id, user_id, type (visite_quotidienne, watch_time, ajustement_admin)
- montant, reference (par exemple watch_session_id), created_at

### Raffle (tirage au sort)

- id, titre, description, date_ouverture, date_tirage
- statut (ouvert, cloture, tire)
- graine_aleatoire, resultat_publie_at

### RaffleLot (lot)

- id, raffle_id, nom, valeur_estimee, quantite, fournisseur

### RaffleTicket

- id, raffle_id, user_id, points_convertis, created_at

### RaffleWinner

- id, raffle_id, lot_id, ticket_id, user_id, notifie_at

### Announcement

- id, titre, texte, actif (booléen), debut_at, fin_at, created_by (admin), created_at

## Contraintes clés à respecter

- Toute variation de `solde_points` doit passer par une `PointsTransaction`
  (source de vérité auditable, pas de mise à jour directe du solde).
- Une `WatchSession` ne peut créditer de points qu'après validation serveur
  des heartbeats (cf. [02-architecture.md](02-architecture.md)).
- Un `RaffleTicket` consomme des points du solde utilisateur au moment de sa
  création (transaction atomique).
- Le tirage (`Raffle.graine_aleatoire` et algorithme) doit être journalisé
  pour permettre un audit indépendant, conformément à
  [10-legal-compliance.md](10-legal-compliance.md).
