---
last_updated: 2026-10-20
---
# 01. Spécifications fonctionnelles V1

Ce document archive le premier jet de cahier des charges transmis par le
client (document "SKUP", juin 2026). Il conserve le contexte historique mais
ne constitue pas la baseline actuelle de périmètre : le brief accepté, la
vision actuelle et les décisions owners du
[registre de traçabilité](design/design-traceability-and-open-actions-2026-10-18.md)
les remplacent en cas d'écart.

**Décision owner du 2026-10-18 :** les valeurs métier non arrêtées (barèmes et
plafonds de points, seuils et gains des cartes, probabilités, prix et
calendrier des tirages/récompenses) restent hors MVP jusqu'à décision des owners
concernés. Les nombres et options ci-dessous sont des propositions historiques,
pas des critères d'acceptation ni des valeurs à implémenter.

## Ancienne proposition de périmètre V1.0/V1.1 (non normative)

Pour tenir un délai resserré sur le premier lancement, certains éléments
documentés ci-dessous sont repoussés juste après la mise en ligne
(V1.1), sans changer l'architecture cible : ce sont des réductions de
périmètre pour le premier livrable, pas des annulations.

**Repoussé en V1.1** :

- Boutique de récompenses (catalogue, achat, envoi de codes) : voir
  section 4. Le ticket de tirage reste obtenable en V1.0 uniquement via
  une carte à gratter.
- Tirage mensuel : voir section 5. Seul le tirage hebdomadaire est actif
  en V1.0.
- Extension navigateur pour Firefox et Opera : voir section 3. Seule la
  version Chrome est livrée en V1.0.

Le classement des autres fonctions dans le premier jet n'est pas une
acceptation du périmètre MVP courant. Se référer aux stories et décisions
owners actuelles avant tout développement.

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
- Aucun compte Google, Twitch ou Facebook ne peut servir à créer un compte,
  ouvrir une session ou récupérer une session Skkup.
- Les plateformes Twitch, YouTube et Facebook restent uniquement les sources
  de streams suivis par l'extension navigateur. Elles ne sont pas des
  fournisseurs d'identité du site.
- Installation de l'extension navigateur (voir section 3) proposée comme étape recommandée de l'onboarding, sans être bloquante pour utiliser le site.

## 2. Points quotidiens (visite du site)

La monnaie virtuelle du site (désignée "points" dans ce document, nom
marketing final à définir avec le client, ex. "Points SKUP") s'obtient de
deux façons : la visite quotidienne et le visionnage (section 3).

- Une visite quotidienne crédite un montant de points fixe.
- Système de série (streak) : un jour manqué remet le streak à zéro.

**Proposition historique non acceptée** : le premier jet faisait évoluer le
mécanisme de récompense de streak vers des **cartes à gratter** plutôt que des
bonus de points fixes. Les seuils, gains, probabilités et contenus ci-dessous
restent hors MVP jusqu'à décision owner :

- une carte à gratter est débloquée aux jours 3, 7, 14 et 30 ; à partir de 40 jours, chaque dizaine débloque une récompense ticket ;
- les gains de points des cartes restent modérés et progressent avec la continuité : 10, 15, 25 puis 40 points selon le palier ;
- un jour manqué remet le streak à zéro et empêche le déblocage du palier manqué.
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
stream** (Twitch, YouTube ou Kick), pas simplement une session
ouverte sur le site. Deux mécanismes complémentaires sont prévus :

- **Extension navigateur (mécanisme principal)** : une extension installée
  par l'utilisateur détecte quand il regarde activement un stream sur les
  sites officiels (twitch.tv, youtube.com, facebook.com), y compris en
  dehors du site SKUP, et envoie des heartbeats authentifiés au backend.
  C'est le développement le plus fiable pour créditer du temps de
  visionnage réel sur les plateformes tierces. **V1.0 : Chrome uniquement.
  Firefox et Opera sont repoussés en V1.1** (même code source WebExtension,
  avec publication et tests sur les stores concernés différés). Voir le
  détail technique et les questions ouvertes dans
  [02-architecture.md](02-architecture.md#extension-navigateur-mesure-du-watch-time).
- **Suivi par extension navigateur** : les viewers regardent les streams sur
  la plateforme de leur choix. L'extension Skkup mesure le visionnage.

Barème proposé dans le premier jet, non retenu comme critère MVP tant que les
owners n'ont pas arrêté les valeurs :

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
une boutique ; le seul moyen d'obtenir un ticket de tirage est de le
gagner via une carte à gratter (voir section 2). Cette section décrit la
cible V1.1, conservée pour ne pas perdre le travail de cadrage déjà fait
avec le client.

Proposition du premier jet, non confirmée comme décision actuelle : le ticket
était modélisé comme un article de boutique « volontairement cher », sans taux
de conversion direct points → ticket. Prix, boutique et calendrier restent
hors MVP jusqu'à décision des owners concernés.

| Type de récompense | Description | Coût |
| --- | --- | --- |
| Code réduction | Code promo d'une marque partenaire, envoyé par email | À définir |
| Bon d'achat numérique | Carte cadeau enseigne (Amazon, LDLC, etc.) | À définir |
| Ticket tirage hebdomadaire | Participation au tirage de la semaine | Prix fort, à définir |
| Ticket tirage mensuel | Participation au grand tirage du mois | Prix fort, à définir (1000 pts évoqué en premier jet) |
| Produit physique | Gadget ou accessoire | Phase 2 uniquement |

**Phase 1 (lancement de la boutique en V1.1)** : uniquement des
récompenses numériques, aucune logistique physique. Les codes et bons
d'achat sont envoyés automatiquement par email après échange des points.

## 5. Tirages au sort (propositions historiques, règles à arbitrer)

- **Tirage hebdomadaire (ancienne proposition V1.0)** : cadence et dotation
  non acceptées comme règle MVP; calendrier et lots restent à décider.
- **Tirage mensuel (ancienne proposition V1.1)** : cadence et dotation
  non acceptées; toute évolution attend une décision owner.
- Le premier jet proposait d'obtenir des tickets par carte à gratter, puis
  aussi par achat en boutique. Ce mécanisme et son prix ne sont pas des règles
  MVP acceptées; voir la [décision ACT-11](product/act-11-values-decision.md).
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
indicateur visuel (flamme, calendrier), section "Mes cartes à gratter"
(cartes disponibles à gratter), prochain tirage avec compte à rebours et
lot affiché, historique des gains récents. Mobile-friendly, responsive
obligatoire. La mini boutique rapide s'ajoutera à ce tableau de bord en
V1.1.

Le compteur de points, le streak, le déblocage d'une carte à gratter et le
compte à rebours/résultat d'un tirage se mettent à jour en temps réel via
WebSocket, sans que l'utilisateur ait besoin de recharger la page (voir
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

## Ancienne proposition de contenu reporté (non normative)

Le premier jet classait les éléments suivants comme reportés. Ce classement
V1.0/V1.1 ne fixe pas le périmètre accepté aujourd'hui; vérifier le brief et les
décisions owners avant toute implémentation.

- Boutique de récompenses, tirage mensuel, extensions Firefox et Opera.

- Vidéos ou offres partenaires façon Freecash.
- Cash-out en argent réel.
- Programme d'affiliation streamer.
- Récompenses physiques (anciennement classées en Phase 2).
- Détail probabiliste des cartes à gratter et seuils chiffrés de streak :
  valeurs non décidées, reportées hors MVP par décision owner du 2026-10-18;
  elles ne doivent pas être interprétées comme des critères d'implémentation
  ([décision ACT-11](product/act-11-values-decision.md)).
