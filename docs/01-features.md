# 01. Spécifications fonctionnelles V1

## 1. Compte et connexion de plateformes

- Inscription/connexion classique (email + mot de passe, ou OAuth Twitch/Google/Facebook directement comme méthode de connexion).
- Liaison de comptes tiers (Twitch, YouTube via Google, Facebook) via OAuth2 pour permettre l'affichage des streams suivis et, en V2, une vérification d'identité de streamer.
- Un utilisateur peut lier plusieurs plateformes à un seul compte site.

## 2. Points quotidiens (visite du site)

- Un point de connexion quotidien crédite un montant de points fixe, avec un système de série (streak) qui augmente le gain les jours consécutifs, plafonné pour éviter l'inflation.
- La série est remise à zéro après une absence de plus de 24 h (fuseau horaire de l'utilisateur ou UTC, à trancher en 02-architecture.md).

## 3. Points de visionnage (watch time)

- Le viewer choisit un stream (Twitch, YouTube ou Facebook Live) proposé sur le site et le regarde via un lecteur embarqué directement sur la page.
- Le frontend envoie des heartbeats périodiques (toutes les 30 à 60 secondes) tant que l'onglet est visible et actif (Page Visibility API) et que le lecteur est réellement en lecture.
- Le backend valide chaque heartbeat (session active, cohérence temporelle, absence d'appels dupliqués ou trop rapprochés) avant de créditer les points correspondants.
- Barème de points par minute de visionnage validée, avec un plafond quotidien par utilisateur pour limiter les abus.
- Voir le détail technique dans [02-architecture.md](02-architecture.md), section mesure du watch time.

## 4. Tirages au sort

- Les points crédités se convertissent en tickets de participation à des tirages programmés (par exemple hebdomadaires, sur le modèle SKUP).
- Chaque tirage affiche : les lots en jeu, la date de tirage, le nombre de tickets déjà distribués, les règles de participation.
- Le tirage lui-même doit être vérifiable (graine aléatoire et algorithme documentés, résultat horodaté et consultable a posteriori).
- Annonce des gagnants sur le site, avec historique des tirages passés et des gagnants (avec consentement RGPD sur l'affichage du pseudo).
- Le cadre juridique associé (règlement de jeu, dépôt, dotations) est détaillé en [10-legal-compliance.md](10-legal-compliance.md).

## 5. Tableau de bord viewer

- Solde de points actuel, historique des gains (visite, watch time) et des tickets utilisés.
- Liste des tirages en cours et passés, avec statut de participation.
- Historique de connexion/série de visite.

## 6. Anti-fraude (spécification fonctionnelle, détail technique en 05-security.md)

- Un compte = une personne : détection de comptes multiples (mêmes appareils, mêmes IP récurrentes, mêmes comptes de plateformes liés).
- Un ticket de tirage doit correspondre à une session de visionnage réelle et vérifiable, pas à un simple appel API répété.
- Limitation de débit sur les heartbeats et sur les actions sensibles (changement d'email, liaison de compte).

## Hors scope V1

- Vidéos ou offres partenaires façon Freecash.
- Cash-out en argent réel.
- Programme d'affiliation streamer.
- Suivi de présence via Twitch Extension (overlay installé par le streamer).
