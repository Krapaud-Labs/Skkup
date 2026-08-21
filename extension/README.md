# Extension navigateur Skkup

Extension WebExtension (Manifest V3) qui mesure le temps de visionnage
sur les pages de direct de Twitch, YouTube et Facebook Live, et le
remonte au backend sous forme de heartbeats.

V1.0 : Chrome uniquement. Le code passe déjà par `webextension-polyfill`
pour que l'ajout de Firefox en V1.1 ne demande pas de réécriture
(ADR-001, [docs/02-architecture.md](../docs/02-architecture.md)).

## Crédit de points

Les routes `POST /watch-sessions*` acceptent le jeton d'appariement de
l'extension (`Authorization: Bearer vrx_...`), au même titre que la
session web. Une session ouverte par l'extension est donc de source
`EXTENSION` et crédite des points, contrairement à une session ouverte
par le lecteur embarqué du site (voir
[docs/04-api-contract.md](../docs/04-api-contract.md), section
Visionnage).

## Ce que l'extension observe, et ce qu'elle ne fait pas

- Elle n'accède qu'aux trois hôtes de visionnage, et uniquement via un
  script de contenu déclaré (`content_scripts.matches`). Aucune
  permission d'hôte n'est demandée sur ces domaines : elle ne peut donc
  ni lire leurs cookies, ni émettre de requêtes en leur nom.
- Elle ne demande ni `tabs`, ni `webNavigation`, ni `history` : elle ne
  voit pas l'historique de navigation, seulement la page dans laquelle
  elle s'exécute.
- La seule permission d'hôte demandée est l'origine de l'API Viewer
  Rewards, la seule que l'extension appelle.
- Le script de contenu n'a jamais accès au jeton d'appariement : il ne
  fait qu'observer l'élément vidéo et transmettre un état de lecture au
  service worker.

## Structure

```text
src/manifeste.ts        Manifeste MV3, construit au build (permissions, motifs)
src/commun/             Client HTTP porteur du jeton, endpoints, stockage, types partagés
src/contenu/            Script de contenu : détection de lecture, indices de page
src/arriere-plan/       Service worker : orchestration des sessions de visionnage
src/popup/              Popup d'association du compte (thème néon du design system)
src/icones/             Icônes du paquet (générées depuis assets/icone.svg)
scripts/build.mjs       Assemblage du dossier dist/ chargeable dans Chrome
```

## Développement

```bash
npm install
npm run build            # produit dist/, avec SKKUP_API_URL ou http://localhost:3001
npm run lint
npm run typecheck
npm test
```

Pour viser une autre API que le développement local :

```bash
SKKUP_API_URL=https://api.skkup.example.com npm run build
```

L'URL est injectée dans le bundle **et** dans la permission d'hôte du
manifeste : les deux ne peuvent pas diverger.

## Installation en mode développeur (Chrome)

1. `npm run build`.
2. Ouvrir `chrome://extensions`, activer le mode développeur.
3. « Charger l'extension non empaquetée » et choisir le dossier
   `extension/dist`.
4. Se connecter sur le site, ouvrir la page `/extension`, générer un code
   d'association.
5. Cliquer sur l'icône de l'extension et recopier le code.

Après chaque `npm run build`, recharger l'extension depuis
`chrome://extensions` pour prendre en compte le nouveau paquet.

## Fonctionnement

1. Le script de contenu repère l'élément vidéo de la page et suit ses
   événements de lecture. Le temps ne compte que si l'onglet est visible
   et au premier plan.
2. Il pousse son état au service worker toutes les 10 à 16 secondes
   pendant la lecture. Le service worker MV3 étant arrêté dès qu'il est
   inactif, ce sont ces messages qui le réveillent. L'intervalle est tiré
   au sort à chaque signal, et pas seulement le délai de heartbeat : sans
   cela, tous les heartbeats retomberaient sur la grille des signaux et
   le serveur mesurerait un intervalle constant.
3. Le service worker ouvre une session de visionnage au premier signal
   de lecture, envoie un heartbeat une fois écoulé un délai de 40 à
   50 secondes (délai volontairement irrégulier, le serveur invalidant
   les cadences rigoureusement identiques), et clôt la session au changement de
   chaîne, à la fermeture de la page ou après 90 secondes de silence.
4. Le backend reste seul juge : chaîne partenaire ou non, durée
   créditée, points accordés. L'extension ne calcule aucun point.
