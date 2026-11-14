---
last_updated: 2026-11-07
---

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
Kick. L’extension prend en charge Twitch, YouTube et Kick
([manifeste](../extension/src/manifeste.ts),
[parseur](../extension/src/commun/plateformes.ts)); Facebook est hors du
périmètre de visionnage. Les preuves d’intégration et de validation restent
suivies dans les gates du projet. Deux mécanismes complémentaires sont prévus :

- **Extension navigateur (mécanisme principal)** : une extension installée
  par l'utilisateur détecte quand il regarde activement un stream sur les
  sites intégrés au code, y compris en dehors du site SKUP, et envoie des
  heartbeats authentifiés au backend.
  C'est le développement le plus fiable pour créditer du temps de
  visionnage réel sur les plateformes tierces. **V1.0 : Chrome uniquement.
  Firefox et Opera sont repoussés en V1.1** (même code source WebExtension,
  avec publication et tests sur les stores concernés différés). Voir le
  détail technique et les questions ouvertes dans
  [02-architecture.md](02-architecture.md#extension-navigateur-mesure-du-watch-time-décision-darchitecture-critique).
- **Éligibilité V1.0** : seuls les visionnages actifs reconnus sur Twitch,
  YouTube Gaming ou Kick via l'extension officielle Skkup dans Chrome de bureau
  peuvent générer des points de visionnage. Les applications natives, sur
  mobile ou ordinateur, les téléphones, tablettes, téléviseurs connectés et
  navigateurs sans l'extension ne sont pas éligibles. Les autres plateformes
  de streaming sont hors périmètre. Firefox et Opera ne deviennent éligibles
  qu'après leur prise en charge prévue en V1.1.
- **Plateformes intégrées** : la décision du responsable produit du
  2026-10-22 fixe Twitch, YouTube et Kick pour le MVP. L’extension prend en
  charge ces trois plateformes; Facebook est hors du périmètre de visionnage.
  La présence du code ne vaut pas à elle seule preuve de validation complète.

Barème de points par heure d'activité de visionnage validée (valeurs
client) :

| Durée d'activité | Points de base | Bonus | Total crédité |
| --- | --- | --- | --- |
| 1 heure | 10 pts | 0 pt | 10 pts |
| 2 heures | 20 pts | 0 pt | 20 pts |
| 3 heures | 30 pts | +5 pts | 35 pts |
| 4 heures | 40 pts | +5 pts | 45 pts |
| 5 heures | 50 pts | +5 pts | 55 pts |
| 6 heures | 60 pts | +5 pts | 65 pts |
| 7 heures | 70 pts | +5 pts | 75 pts |
| 8 heures (plafond) | 80 pts | +10 pts | 90 pts |

Les bonus de palier sont cumulés : +5 points à partir de 3 heures, puis
5 points supplémentaires à 8 heures. Le bonus de stream éventuel s'ajoute
aux points horaires, dans la limite du plafond quotidien de 90 points.
Au-delà de 8 heures de visionnage validé, aucun point de visionnage
supplémentaire n'est crédité ce jour-là.

## 4. Boutique de récompenses

La boutique avait été planifiée pour la V1.1. Le 14 novembre 2026, le
propriétaire a confirmé son périmètre fonctionnel : codes promotionnels,
bons d’achat numériques et tickets liés aux tirages ouverts. Le prix est
configuré en points pour chaque article dans l’Admin; aucun taux monétaire
de conversion n’est défini. Cette décision ouvre le travail d’implémentation
mais ne vaut pas déclaration de disponibilité avant la livraison technique.

| Type de récompense | Description | Coût |
| --- | --- | --- |
| Code réduction | Code promo numérique consultable par son acheteur dans Mes achats | Prix en points configuré par article |
| Bon d'achat numérique | Bon numérique consultable par son acheteur dans Mes achats | Prix en points configuré par article |
| Ticket de tirage | Participation au tirage ouvert associé à l’article | Prix en points configuré par article |
| Produit physique | Gadget ou accessoire | Phase 2 uniquement |

Les points sont débités lors d’un achat validé. Un code ou bon est attribué
à une seule commande et ne peut être consulté que par son acheteur dans
Mes achats. L’envoi par email est reporté jusqu’à la mise en place d’un
service de mailing. Les tickets achetés sont enregistrés dans le même
registre auditable que les autres tickets du tirage. Aucun achat d’argent,
achat de points, cash-out ou produit physique n’est inclus.

La qualification juridique du parcours d’achat de tickets avec des points
reste à examiner avant l’activation publique; l’implémentation technique
ne constitue pas une validation juridique. Voir
[`10-legal-compliance.md`](10-legal-compliance.md).

## 5. Tirages au sort

- **Tirage hebdomadaire (V1.0)** : un seul gagnant par semaine, petit lot
  fourni par un sponsor. C'est le seul tirage actif au lancement.
- **Tirage mensuel (V1.1)** : un seul gagnant par mois, lot plus
  important. Repoussé juste après le lancement, en même temps que la
  boutique.
- Les tickets peuvent aussi être obtenus par achat en points dans la boutique
  selon la décision du propriétaire du 14 novembre 2026; seuls les tirages
  ouverts associés sont éligibles.
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

La gestion du catalogue de boutique et des commandes est accessible depuis
la page Admin « Boutique ». Les lots matériels d’un tirage et ceux de ses
sponsors restent gérés dans Tirages et Sponsors. Les utilisateurs accèdent
à la boutique depuis leur espace Viewer; le tirage mensuel reste planifié en
V1.1.

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
