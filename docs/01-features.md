# 01. Spécifications fonctionnelles V1

Ce document intègre le premier jet de cahier des charges transmis par le
client (document "SKUP", juin 2026), réconcilié avec le cadrage initial.
Les chiffres du barème et des paliers sont ceux fournis par le client ; ils
pourront être ajustés en test avant lancement mais servent de référence de
travail.

## Modèle économique

La plateforme est entièrement gratuite pour les viewers. Le fonctionnement
est financé par des partenariats avec des sponsors et des marques, qui
fournissent les lots des tirages et les récompenses de la boutique en
échange de visibilité (logos partenaires sur le site, mise en avant de
leurs lots). Ce point n'a pas d'impact sur la qualification juridique de
jeu-concours (aucune contrepartie financière n'est demandée au
participant, voir [10-legal-compliance.md](10-legal-compliance.md)), mais
implique une gestion des relations sponsors côté back-office.

## 1. Compte et connexion de plateformes

- Inscription/connexion classique (email + mot de passe, ou OAuth Twitch/Google/Facebook directement comme méthode de connexion).
- **La liaison de comptes tiers (Twitch, YouTube via Google, Facebook) est
  entièrement optionnelle.** Elle n'est pas nécessaire pour gagner des
  points : la mesure du watch time repose sur l'extension navigateur (voir
  section 3), pas sur une autorisation demandée à Twitch/YouTube/Facebook.
  La liaison de compte, quand l'utilisateur choisit de la faire, sert
  uniquement de confort (se connecter plus vite, retrouver ses streams
  suivis) et, en V2, à une éventuelle vérification d'identité de streamer.
  Ce choix évite toute dépendance à un accord commercial ou une validation
  d'app par ces plateformes.
- Un utilisateur peut lier plusieurs plateformes à un seul compte site s'il
  le souhaite.
- Installation de l'extension navigateur (voir section 3) proposée comme étape recommandée de l'onboarding, sans être bloquante pour utiliser le site.

## 2. Points quotidiens (visite du site)

La monnaie virtuelle du site (désignée "points" dans ce document, nom
marketing final à définir avec le client, ex. "Points SKUP") s'obtient de
deux façons : la visite quotidienne et le visionnage (section 3).

- Une visite quotidienne crédite un montant de points fixe.
- Système de série (streak) : un jour manqué remet le streak à zéro.

**Point encore ouvert avec le client** : le mécanisme de récompense de
streak évolue vers des **cartes à gratter** plutôt que des bonus de points
fixes. Le principe retenu pour l'instant :

- une carte à gratter est débloquée à certains paliers de connexions
  consécutives (paliers évoqués par le client : 1, 3, 7, 14 et 30 jours,
  **à finaliser ensemble**, y compris lesquels donnent une carte plutôt
  qu'un simple bonus de points) ;
- gratter la carte depuis le tableau de bord révèle un gain aléatoire
  (points, ticket de tirage, ou autre récompense) ;
- le détail probabiliste (contenu possible, probabilités de chaque gain)
  reste à définir avec le client avant l'implémentation, de même que
  l'expérience visuelle de grattage (à concevoir avec l'agent frontend en
  cohérence avec le thème gamer néon).

L'ancien tableau de paliers du premier jet de cahier des charges (bonus de
points fixes à 3/7 jours, cartes à 14/30 jours) est conservé ici à titre de
référence historique mais **n'est plus la version cible** :

| Palier (ancienne version) | Récompense (ancienne version) |
| --- | --- |
| 3 jours consécutifs | +50 points bonus |
| 7 jours consécutifs | +100 points bonus |
| 14 jours consécutifs | 1 carte bonus |
| 30 jours consécutifs | 2 cartes bonus |

## 3. Points de visionnage (watch time)

Les points de visionnage récompensent le **temps réel passé à regarder un
stream** (Twitch, YouTube ou Facebook Live), pas simplement une session
ouverte sur le site. Deux mécanismes complémentaires sont prévus :

- **Extension navigateur (mécanisme principal)** : une extension installée
  par l'utilisateur détecte quand il regarde activement un stream sur les
  sites officiels (twitch.tv, youtube.com, facebook.com), y compris en
  dehors du site SKUP, et envoie des heartbeats authentifiés au backend.
  C'est le développement le plus fiable pour créditer du temps de
  visionnage réel sur les plateformes tierces. Voir le détail technique et
  les questions ouvertes dans
  [02-architecture.md](02-architecture.md#extension-navigateur-mesure-du-watch-time).
- **Lecteur embarqué sur le site (mécanisme de repli)** : pour les viewers
  qui n'installent pas l'extension, un lecteur officiel embarqué sur une
  page du site permet de mesurer un temps de visionnage réel, mais
  uniquement pour ce qui est regardé via le site.

Barème de points par heure d'activité de visionnage validée (valeurs
client) :

| Durée d'activité | Points de base | Bonus | Total crédité |
| --- | --- | --- | --- |
| 1 heure | 10 pts | 0 pt | 10 pts |
| 2 heures | 20 pts | 0 pt | 20 pts |
| 3 heures | 30 pts | +5 pts | 35 pts |
| 4 heures | 40 pts | +5 pts | 45 pts |
| 5 heures | 50 pts | +5 pts | 55 pts |
| 6 heures (plafond) | 60 pts | +5 pts | 65 pts |

Plafond quotidien : 65 points maximum par jour, quelle que soit la durée
d'activité au-delà de 6 heures.

## 4. Boutique de récompenses

L'utilisateur choisit sa stratégie : dépenser ses points en boutique ou les
accumuler pour obtenir un ticket de tirage.

Confirmé avec le client : **le ticket de tirage est un article de la
boutique, volontairement cher**, à côté des autres récompenses. Il n'y a
pas de taux de conversion simple points → ticket ; c'est un achat à part
entière, au même titre qu'un bon d'achat. La seconde façon d'obtenir un
ticket est de le gagner via une carte à gratter (voir section 2).

| Type de récompense | Description | Coût |
| --- | --- | --- |
| Code réduction | Code promo d'une marque partenaire, envoyé par email | À définir |
| Bon d'achat numérique | Carte cadeau enseigne (Amazon, LDLC, etc.) | À définir |
| Ticket tirage hebdomadaire | Participation au tirage de la semaine | Prix fort, à définir |
| Ticket tirage mensuel | Participation au grand tirage du mois | Prix fort, à définir (1000 pts évoqué en premier jet) |
| Produit physique | Gadget ou accessoire | Phase 2 uniquement |

**Phase 1 (lancement)** : uniquement des récompenses numériques, aucune
logistique physique. Les codes et bons d'achat sont envoyés automatiquement
par email après échange des points.

## 5. Tirages au sort

- **Tirage hebdomadaire** : un seul gagnant par semaine, petit lot fourni
  par un sponsor.
- **Tirage mensuel** : un seul gagnant par mois, lot plus important.
- Accès uniquement via des tickets achetés à prix fort dans la boutique
  (section 4) ou gagnés via une carte à gratter (section 2).
- Chaque tirage affiche : les lots en jeu, la date de tirage, le nombre de
  tickets déjà distribués, les règles de participation.
- Le tirage lui-même doit être vérifiable (graine aléatoire et algorithme
  documentés, résultat horodaté et consultable a posteriori).
- Annonce des gagnants sur le site, avec historique des tirages passés et
  des gagnants (avec consentement RGPD sur l'affichage du pseudo).
- Les tirages sont entièrement gratuits : aucun achat d'argent réel requis,
  uniquement des points gagnés par l'activité.
- Le cadre juridique associé (règlement de jeu, dépôt, dotations) est
  détaillé en [10-legal-compliance.md](10-legal-compliance.md).

## 6. Pages attendues pour la première maquette

Le client a demandé en priorité deux pages, en dark mode, dominante
violet/rose, style gaming adulte (pas enfantin).

### Page 1. Accueil / vitrine

Seule page visible sans compte. Objectif : donner envie de s'inscrire
immédiatement.

Éléments à intégrer : logo bien mis en valeur, accroche courte et
percutante, vitrine des lots du moment (tirage hebdo + mensuel),
explication du fonctionnement en 3 étapes avec icônes ("Tu regardes / Tu
accumules / Tu gagnes"), compteur de membres inscrits ou participants
actifs, bouton d'inscription bien visible, section "Nos partenaires" pour
les logos sponsors.

### Page 2. Dashboard utilisateur

Objectif : donner à l'utilisateur connecté une vue claire de sa
progression et de ses récompenses disponibles.

Éléments à intégrer : barre de progression des points avec objectif
suivant visible, compteur de points actuels, streak actuel affiché avec
indicateur visuel (flamme, calendrier), section "Mes cartes à gratter"
(cartes disponibles à gratter), mini boutique rapide (récompenses accessibles avec
le solde actuel), prochain tirage avec compte à rebours et lot affiché,
historique des gains récents. Mobile-friendly, responsive obligatoire.

Le compteur de points, le streak, le déblocage d'une carte à gratter et le
compte à rebours/résultat d'un tirage se mettent à jour en temps réel via
WebSocket, sans que l'utilisateur ait besoin de recharger la page (voir
[02-architecture.md](02-architecture.md#temps-réel-websocket)).

Voir aussi [06-frontend-design-system.md](06-frontend-design-system.md)
pour la charte graphique associée.

## 7. Back-office administrateur

Interface d'administration requise dès la V1 pour :

- créer et gérer les tirages (lots, dates, statut) ;
- gérer les sponsors et leurs lots associés ;
- gérer le catalogue de la boutique (codes promo, bons d'achat) ;
- consulter les signalements anti-fraude (voir
  [05-security.md](05-security.md)).

Accès restreint, à sécuriser en priorité avec l'agent cybersécurité (voir
les endpoints `/admin/*` dans
[04-api-contract.md](04-api-contract.md)).

## 8. Anti-fraude (spécification fonctionnelle, détail technique en 05-security.md)

- Un compte = une personne : détection de comptes multiples (mêmes appareils, mêmes IP récurrentes, mêmes comptes de plateformes liés).
- Un ticket de tirage doit correspondre à une session de visionnage réelle et vérifiable, pas à un simple appel API répété.
- Limitation de débit sur les heartbeats et sur les actions sensibles (changement d'email, liaison de compte).
- L'extension navigateur ajoute une surface d'abus supplémentaire (faux
  heartbeats émis par une extension modifiée) à couvrir spécifiquement.

## Hors scope V1

- Vidéos ou offres partenaires façon Freecash.
- Cash-out en argent réel.
- Programme d'affiliation streamer.
- Récompenses physiques (repoussées en Phase 2).
- Détail probabiliste des cartes à gratter et paliers de streak exacts qui
  les débloquent (à finaliser avec le client avant implémentation).
