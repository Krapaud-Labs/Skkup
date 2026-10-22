# 01. Spécifications fonctionnelles V1

Ce document intègre le premier jet de cahier des charges transmis par le
client (document "SKUP", juin 2026), réconcilié avec le cadrage initial.
La baseline de streak ci-dessous reprend les règles du cahier accepté. Les
valeurs de récompense et de prix qui n’y figurent pas restent à décider; elles
ne sont pas déduites de tableaux antérieurs.

## Périmètre V1.0 (MVP, objectif environ 1 mois) vs V1.1 (juste après)

Pour tenir un délai resserré sur le premier lancement, certains éléments
documentés ci-dessous sont repoussés juste après la mise en ligne
(V1.1), sans changer l'architecture cible : ce sont des réductions de
périmètre pour le premier livrable, pas des annulations.

**Repoussé en V1.1** :

- Boutique de récompenses (catalogue, achat, envoi de codes) : voir
  section 4; elle est repoussée en V1.1.
- Tirage mensuel : voir section 5. Seul le tirage hebdomadaire est actif
  en V1.0.
- Extension navigateur pour Firefox et Opera : voir section 3. Seule la
  version Chrome est livrée en V1.0.

Le périmètre V1.0 comprend le compte natif, les points quotidiens, le
watch time via extension Chrome, le tirage hebdomadaire, le tableau de bord
temps réel, le back-office de base et les messages d'actualité. Les règles
de récompense du streak qui ne sont pas fixées ci-dessous restent hors MVP
jusqu’à une décision explicite.

## Modèle économique

La plateforme est entièrement gratuite pour les viewers. Le fonctionnement
est financé par des partenariats avec des sponsors et des marques, qui
fournissent les lots des tirages et les récompenses de la boutique en
échange de visibilité (logos partenaires sur le site, mise en avant de
leurs lots). Ce point n'a pas d'impact sur la qualification juridique de
jeu-concours (aucune contrepartie financière n'est demandée au
participant, voir [10-legal-compliance.md](10-legal-compliance.md)), mais
implique une gestion des relations sponsors côté back-office.

## 1. Compte et connexion

- Inscription et connexion exclusivement via le formulaire natif du site,
  avec adresse email, mot de passe et pseudo à l'inscription.
- Aucun compte d’une plateforme tierce ne peut servir à créer un compte,
  ouvrir une session ou récupérer une session Skkup.
- Une liaison OAuth éventuelle à un compte de plateforme est une évolution
  distincte, non incluse au périmètre accepté.
- Installation de l'extension navigateur (voir section 3) proposée comme étape recommandée de l'onboarding, sans être bloquante pour utiliser le site.

## 2. Points quotidiens (visite du site)

La monnaie virtuelle du site (désignée "points" dans ce document, nom
marketing final à définir avec le client, ex. "Points SKUP") s'obtient de
deux façons : la visite quotidienne et le visionnage (section 3).

- Une visite quotidienne crédite un montant de points fixe.
- Système de série (streak) : un jour manqué remet le streak à zéro.

Le cahier accepté fixe la baseline métier du streak :

- les paliers sont 1, 3, 7, 14 et 30 jours ;
- le bonus de chaque palier est attribué une seule fois ;
- un jour manqué remet le compteur à zéro ;
- les récompenses déjà obtenues restent acquises.

Le cahier ne précise ni la nature ni le montant des bonus, ni une
correspondance entre palier et type de récompense. Ces choix, les prix des
tickets ou récompenses et les probabilités d’éventuels gains aléatoires
restent explicitement hors MVP jusqu’à une décision du responsable produit.
Aucune règle détaillée de carte à gratter ne doit être déduite de cette
baseline. L’expérience visuelle d’une éventuelle récompense reste également
à concevoir après décision de périmètre.

## 3. Points de visionnage (watch time)

Les points de visionnage récompensent le **temps réel passé à regarder un
stream**, pas simplement une session ouverte sur le site. Par décision du
responsable produit du 2026-10-22, le périmètre MVP vise Twitch, YouTube et
Kick. Le code actuel de l’extension traite Twitch, YouTube et Facebook
([manifeste](../extension/src/manifeste.ts),
[parseur](../extension/src/commun/plateformes.ts)); Kick n’y est pas encore
intégré et Facebook est hors de la cible sélectionnée. Cet écart entre la
cible décidée et l’implémentation observée ne vaut pas preuve de prise en
charge. Deux mécanismes complémentaires sont prévus :

- **Extension navigateur (mécanisme principal)** : une extension installée
  par l'utilisateur détecte quand il regarde activement un stream sur les
  sites intégrés au code, y compris en dehors du site SKUP, et envoie des
  heartbeats authentifiés au backend.
  C'est le développement le plus fiable pour créditer du temps de
  visionnage réel sur les plateformes tierces. **V1.0 : Chrome uniquement.
  Firefox et Opera sont repoussés en V1.1** (même code source WebExtension,
  avec publication et tests sur les stores concernés différés). Voir le
  détail technique et les questions ouvertes dans
  [02-architecture.md](02-architecture.md#extension-navigateur-mesure-du-watch-time).
- **Plateformes intégrées** : la décision du responsable produit du
  2026-10-22 fixe Twitch, YouTube et Kick pour le MVP. L'extension mesure
  uniquement les sites effectivement intégrés; son support actuel reste
  Twitch, YouTube et Facebook. Kick reste à intégrer et Facebook est hors de
  la cible. Cette divergence n'est pas une preuve d'implémentation.

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

## 4. Boutique de récompenses (V1.1, hors périmètre V1.0)

**Repoussée juste après le lancement (V1.1)** pour tenir le délai du
premier livrable. En V1.0, l'utilisateur ne dépense pas ses points dans
une boutique. Le mode d’obtention des tickets au MVP n’est pas précisé
par le cahier accepté et reste à décider avant implémentation. Cette section
décrit la cible V1.1, conservée pour ne pas perdre le travail de cadrage
déjà fait avec le client.

La boutique est prévue comme périmètre V1.1. Les prix et le taux de
conversion points → récompense ne sont pas fixés par le cahier accepté; ils
restent à décider et sont hors MVP. Aucun montant évoqué dans un premier
jet n’est retenu comme décision.

| Type de récompense | Description | Coût |
| --- | --- | --- |
| Code réduction | Code promo d'une marque partenaire, envoyé par email | À définir hors MVP |
| Bon d'achat numérique | Carte cadeau enseigne (Amazon, LDLC, etc.) | À définir hors MVP |
| Ticket tirage hebdomadaire | Participation au tirage de la semaine | À définir hors MVP |
| Ticket tirage mensuel | Participation au grand tirage du mois | À définir hors MVP |
| Produit physique | Gadget ou accessoire | Phase 2 uniquement |

**Phase 1 (lancement de la boutique en V1.1)** : uniquement des
récompenses numériques, aucune logistique physique. Les codes et bons
d'achat sont envoyés automatiquement par email après échange des points.

## 5. Tirages au sort

- **Tirage hebdomadaire (V1.0)** : un seul gagnant par semaine, petit lot
  fourni par un sponsor. C'est le seul tirage actif au lancement.
- **Tirage mensuel (V1.1)** : un seul gagnant par mois, lot plus
  important. Repoussé juste après le lancement, en même temps que la
  boutique.
- Le cahier accepté confirme les tickets mais ne spécifie pas leur mode
  d’obtention au MVP. Le prix d’un ticket boutique relève de la V1.1 et
  reste à définir (section 4).
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
percutante, vitrine du lot du tirage hebdomadaire en cours (le tirage
mensuel s'ajoutera à cette vitrine en V1.1), explication du fonctionnement
en 3 étapes avec icônes ("Tu regardes / Tu accumules / Tu gagnes"),
compteur de membres inscrits ou participants actifs, bouton d'inscription
bien visible, section "Nos partenaires" pour les logos sponsors.

**Messages d'actualité du site** : un bandeau ou une section dédiée affiche
des messages d'annonce (maintenance prévue, nouveau tirage, nouveauté) que
l'administrateur publie lui-même depuis le back-office, sans intervention
technique. Chaque message a un titre, un texte court, une période
d'affichage optionnelle (dates de début/fin), et peut être activé ou
désactivé à tout moment. Géré comme le reste depuis le back-office (voir
section 7).

### Page 2. Dashboard utilisateur

Objectif : donner à l'utilisateur connecté une vue claire de sa
progression et de ses récompenses disponibles.

Éléments à intégrer : barre de progression des points avec objectif
suivant visible, compteur de points actuels, streak actuel affiché avec
indicateur visuel (flamme, calendrier), progression selon les paliers de
streak confirmés, prochain tirage avec compte à rebours et lot affiché,
historique des gains récents. Mobile-friendly, responsive
obligatoire. La mini boutique rapide s'ajoutera à ce tableau de bord en
V1.1.

Le compteur de points, le streak et le compte à rebours/résultat d'un
tirage se mettent à jour en temps réel via WebSocket, sans que l'utilisateur ait besoin de recharger la page (voir
[02-architecture.md](02-architecture.md#temps-réel-websocket)).

Voir aussi [06-frontend-design-system.md](06-frontend-design-system.md)
pour la charte graphique associée.

## 7. Back-office administrateur

Interface d'administration requise dès la V1.0 pour :

- créer et gérer le tirage hebdomadaire (lots, dates, statut) ;
- gérer les sponsors et leurs lots associés ;
- publier, modifier ou désactiver les messages d'actualité affichés sur la
  page d'accueil (voir section 6) ;
- consulter les signalements anti-fraude (voir
  [05-security.md](05-security.md)).

La gestion du catalogue de la boutique (codes promo, bons d'achat) et du
tirage mensuel s'ajoute en V1.1, en même temps que ces fonctionnalités
côté utilisateur.

Accès restreint, à sécuriser en priorité avec l'agent cybersécurité (voir
les endpoints `/admin/*` dans
[04-api-contract.md](04-api-contract.md)).

## 8. Anti-fraude (spécification fonctionnelle, détail technique en 05-security.md)

- Un compte = une personne : détection de comptes multiples (mêmes appareils, mêmes IP récurrentes, mêmes comptes de plateformes liés).
- Un ticket de tirage doit correspondre à une session de visionnage réelle et vérifiable, pas à un simple appel API répété.
- Limitation de débit sur les heartbeats et sur les actions sensibles (changement d'email, liaison de compte).
- L'extension navigateur ajoute une surface d'abus supplémentaire (faux
  heartbeats émis par une extension modifiée) à couvrir spécifiquement.

## Hors scope V1.0 (V1.1 ou plus tard)

- Boutique de récompenses, tirage mensuel, extensions Firefox et Opera : voir la
  section dédiée en haut de ce document (repoussés en V1.1).
- Vidéos ou offres partenaires façon Freecash.
- Cash-out en argent réel.
- Programme d'affiliation streamer.
- Récompenses physiques (repoussées en Phase 2).
- Nature et montant des récompenses de streak, prix des tickets ou
  récompenses et probabilités de gains éventuels; ces paramètres restent
  hors MVP jusqu’à décision explicite du responsable produit.
---
last_updated: 2026-10-22
---
