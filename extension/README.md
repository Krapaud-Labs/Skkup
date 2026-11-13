# Extension navigateur Skkup

Extension WebExtension (Manifest V3) qui mesure le temps de visionnage
sur les pages de direct Twitch, YouTube et Kick, et le remonte au backend
sous forme de heartbeats. Facebook n’est pas une plateforme prise en charge.

V1.0 : Chrome uniquement. Le code passe déjà par `webextension-polyfill`
pour que l'ajout de Firefox et Opera en V1.1 ne demande pas de réécriture
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

- Elle observe Twitch, YouTube et Kick en HTTPS, uniquement via un
  script de contenu déclaré (`content_scripts.matches`). Aucune
  permission d'hôte n'est demandée sur ces domaines : elle ne peut donc
  ni lire leurs cookies, ni émettre de requêtes en leur nom.
- Elle ne demande ni `tabs`, ni `webNavigation`, ni `history` : elle ne
  voit pas l'historique de navigation, seulement la page dans laquelle
  elle s'exécute.
- La seule permission d'hôte demandée est l'origine de l'API Skkup, la seule
  que l'extension appelle.
- Le script de contenu n'a jamais accès au jeton d'appariement : il ne
  fait qu'observer l'élément vidéo et transmettre un état de lecture au
  service worker.

## Structure

```text
src/manifeste.ts        Manifeste MV3, construit au build (permissions, motifs)
src/commun/             Client HTTP porteur du jeton, endpoints, stockage, types partagés
src/contenu/            Script de contenu : détection de lecture, indices de page
src/arriere-plan/       Service worker : orchestration des sessions de visionnage
src/popup/              Popup d'association et de suivi (thème du design system)
../frontend/assets/extension/icons/ Sources des icônes du paquet
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

## E2E Chrome MV3 isolé dans Docker

Le parcours `e2e/extension-mv3-pairing.mjs` charge le build `dist/` dans
Chromium avec un vrai profil persistant. Il crée un compte synthétique via
l'API isolée, génère le code avec sa session web, effectue l'association dans
la popup MV3, vérifie `chrome.storage.local` après rechargement, puis vérifie
l'accès API du credential et son refus après révocation. Le contrôle après
révocation utilise un client HTTP sans cookie viewer pour isoler la vérification
du credential et éviter toute interférence de session ou de CSRF.
Le lint analyse aussi ce script E2E et connaît l’API `chrome` disponible dans
le contexte d’extension du navigateur.

Ce script refuse de démarrer si `SKKUP_E2E_DOCKER=1` n'est pas défini. Il
requiert les variables `SKKUP_API_URL` (boucle locale du backend Docker),
`SKKUP_EXTENSION_PATH` (build MV3 `dist/`) et `PLAYWRIGHT_MODULE_PATH`
(Playwright fourni par l'image de test); `CHROME_BIN` est facultatif. Il doit
être lancé exclusivement par le runner Compose Docker isolé, qui
fournit ces paramètres, le réseau privé et une base jetable, puis détruit les
conteneurs, le réseau et le volume. Pour autoriser l'origine réelle de la
popup sans élargir CORS, le runner injecte la clé publique
`e2e/manifest-test-public-key.base64` dans le seul `dist/manifest.json` jetable.
Elle fixe l'identifiant de test `deiocobgdepiffcgincdjkdjoepbcggh`; le backend
autorise exactement `chrome-extension://deiocobgdepiffcgincdjkdjoepbcggh`.
L'assertion `SKKUP_EXTENSION_TEST_ID` confirme cette identité au lancement.
Aucun manifeste ni paquet de production ne reçoit cette clé. Cette preuve
concerne Chromium dans le runner Docker avec une extension locale non empaquetée;
elle ne prouve pas une installation Chrome Web Store ni un déploiement en
production. Ne pas lancer cette commande directement sur l'hôte.

```bash
bash extension/scripts/test-e2e-browser-docker.sh
```

Pour préparer un paquet de publication Chrome avec l'API de production :

```bash
SKKUP_API_URL=https://api.skkup.fr npm run build
cd dist && zip -r -X ../Skkup-extension-v0.1.0.zip .
```

Le fichier ZIP contient uniquement les artefacts générés dans `dist/` et ne
doit jamais inclure de secret ni de fichier `.env`.

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

## Captures pour la fiche Chrome Web Store

Les captures promotionnelles sont conservées dans `../frontend/assets/extension/store/` :

- `skuup-extension-association.jpg` : association d'un compte par code à durée
  limitée ;
- `skuup-extension-suivi.jpg` : état associé et suivi prêt à détecter un direct,
  avec la progression vers le prochain crédit de points,
  renvoyée par le serveur.
- `skkup-promo-small.jpg` et `skkup-promo-large.jpg` : visuels promotionnels
  de la fiche, avec les plateformes Twitch, YouTube et Kick.

Elles sont exportées en 640 × 400 px depuis un aperçu fidèle construit à partir
des composants de la popup. Le nom « Compte de démonstration » et la progression
sont fictifs; aucun code d'association actif ni compte réel n'apparaît dans les
images.

## Préparer une version Chrome Web Store

La version de l'extension suit le champ `version` de `package.json` et est
injectée dans le manifeste généré. Avant un téléversement, elle doit être
strictement supérieure à la dernière version publiée dans le Chrome Web Store.
Le paquet de production utilise l'API `https://api.skkup.fr` et contient
uniquement le dossier `dist/` généré :

```bash
SKKUP_API_URL=https://api.skkup.fr npm run build
rm -f Skkup-extension-v*.zip
cd dist && zip -r -X ../Skkup-extension-v0.2.0.zip .
```

Relire le manifeste et le contenu du ZIP avant de le téléverser. Ne jamais y
inclure `.env`, des jetons, ou la clé publique de test E2E.

Le logo de la popup et les icônes du manifeste sont également centralisés dans
`../frontend/assets/`. `npm run build` les copie dans `dist/`; les fichiers générés dans
`dist/` ne sont pas les sources à modifier. Voir [`../frontend/assets/README.md`](../frontend/assets/README.md).

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

La popup affiche le temps validé transmis par le backend après un heartbeat
accepté. Le bloc « Progression de visionnage » reste masqué tant qu'aucune
progression serveur n'est disponible ou si le serveur renvoie `null`; il
n'utilise jamais la position locale du lecteur. Le backend fournit
`progressionVisionnage` avec le statut, les
secondes validées du jour, le temps restant avant le prochain palier et le
crédit de points prévu. Au plafond journalier, le statut `PLAFOND_ATTEINT`
remplace le décompte par son explication. Ces valeurs restent indicatives,
car les bonus et la chaîne suivie peuvent modifier le prochain crédit.

## Plateformes reconnues

Le parseur accepte les pages de chaîne Twitch, les chaînes YouTube relevées
dans l’URL, les métadonnées ou la réponse JSON `ytInitialPlayerResponse` des
scripts inline. Le fallback inline n’accepte le `channelId` `UC…` que si le
`videoId` de la réponse correspond à l’URL `/watch?v=…` ou `/live/<id>`; le
script n’est jamais exécuté. Les indices manquants sont réessayés au plus une
fois toutes les cinq secondes par URL et les résultats trouvés sont mis en
cache jusqu’au changement d’URL. Pour Kick, les URL de chaîne usuelles
`kick.com/<slug>` (avec ou sans `www`, slash final ou paramètres) sont suivies.
Les routes de catégorie, recherche, vidéo et autres pages de navigation Kick
sont ignorées.
Le manifeste injecte le script de contenu sur `twitch.tv`, `youtube.com` et
`kick.com` en HTTPS, sans permission d’hôte pour ces plateformes. Les URL
Facebook sont ignorées; elles n’ouvrent aucune session de visionnage.

Quand plusieurs éléments vidéo sont présents, l’extension privilégie un média
actif, visible et non muet, puis un média actif visible et enfin tout média
actif. Si aucun n’est actif, elle retombe sur le premier élément du document.

Vérification ciblée après une modification du parseur ou du manifeste :
`npm test -- src/commun/plateformes.test.ts src/manifeste.test.ts src/contenu/indices-page.test.ts src/contenu/cache-indices-page.test.ts src/contenu/selection-video.test.ts`,
puis `npm run typecheck` et `npm run build`.
