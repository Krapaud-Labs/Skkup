# 00. Vision produit

## Pitch

Une plateforme communautaire "gamer néon" qui récompense les viewers de streams (Twitch, YouTube, Facebook Live) pour :

- leur **visite quotidienne** du site,
- le **temps passé à regarder un stream** via le site (lecteur embarqué).

Les points gagnés servent de **tickets de participation à des tirages au sort** réguliers offrant des lots réels (gadgets tech, cartes cadeaux...), sur le modèle de référence fourni par le client (SKUP : "Tu regardes → Tu accumules → Tu gagnes").

Il n'y a **pas de cash-out en argent réel** (contrairement au modèle Freecash, écarté). Cette distinction est structurante : elle place le projet dans le cadre juridique du jeu-concours/loterie publicitaire plutôt que du jeu d'argent (voir [10-legal-compliance.md](10-legal-compliance.md)).

## Personas

- **Le viewer fidèle** : suit déjà des streamers sur Twitch/YouTube, veut être récompensé pour un temps qu'il passe de toute façon à regarder du contenu.
- **Le chasseur de lots** : motivé principalement par les tirages au sort et la valeur des dotations, viendra régulièrement vérifier ses tickets et les lots en cours.
- **Le streamer partenaire** (à considérer en V2) : peut vouloir que sa communauté soit récompensée pour la fidélité, potentiel de partenariat/affiliation.

## Objectifs métier V1

1. Permettre à un viewer de créer un compte et lier ses comptes Twitch / YouTube / Facebook.
2. Créditer des points pour la visite quotidienne (streak) et le temps de visionnage réel de streams via lecteur embarqué sur le site.
3. Convertir les points en tickets de participation à des tirages au sort programmés, avec annonce des gagnants.
4. Offrir un tableau de bord viewer : solde de points, historique, tickets, tirages en cours/passés.
5. Poser les fondations anti-fraude (un ticket = une session de visionnage réelle et vérifiable).

## Hors scope V1 (à documenter comme pistes V2)

- Vidéos/offres partenaires façon Freecash (sondages, essais d'applications).
- Cash-out en argent réel.
- Suivi de présence via Twitch Extension (overlay installé par le streamer).
- Programme d'affiliation streamer.

## Documents liés

- [01-features.md](01-features.md) : spécifications fonctionnelles détaillées
- [02-architecture.md](02-architecture.md) : architecture technique et ADRs
- [06-frontend-design-system.md](06-frontend-design-system.md) : thème gamer néon
- [10-legal-compliance.md](10-legal-compliance.md) : cadre juridique jeu-concours
