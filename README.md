# Skkup

Plateforme communautaire qui récompense les viewers de streams (Twitch,
YouTube, Kick) pour leur visite quotidienne et leur temps de
visionnage. Les points gagnés servent de tickets de participation à des
tirages au sort réguliers, avec de vrais lots à la clé.

La documentation complète du projet (vision, spécifications
fonctionnelles, architecture, modèle de données, sécurité, design system,
CI/CD, Docker, gitflow, conformité légale) se trouve dans
[docs/](docs/00-overview.md).

## Structure du dépôt

```text
docs/           Documentation du projet (voir docs/00-overview.md)
backend/        API NestJS + Prisma (PostgreSQL)
frontend/       Application Next.js + Tailwind (design system en place)
extension/      Extension navigateur WebExtension MV3 (Chrome en V1.0)
infra/          Fichiers d'infrastructure complémentaires
docker-compose.yml           Topologie Docker de base (voir docs/08-docker-infra.md)
docker-compose.override.yml  Dev local (ports directs, chargé automatiquement)
docker-compose.prod.yml      Production (TLS Traefik/Let's Encrypt, routage par domaine)
docker-compose.dokploy.yml   Production sur Dokploy (proxy et TLS gérés par le panel)
CONTRIBUTING.md              Gitflow, conventions de commits et de code
```

## État d'avancement

- Backend : scaffold NestJS + Prisma (PostgreSQL) opérationnel,
  authentification email/mot de passe (JWT porté par un cookie de
  session `httpOnly`, avec vérification d'origine anti-CSRF) en place,
  sessions de visionnage avec validation anti-fraude des heartbeats en
  place (garde combinée acceptant la session web ou le jeton d'une
  extension appariée, source dérivée du credential et jamais du payload
  client, crédit de points pour les sessions web et extension après validation
  serveur, avec bonus horaire optionnel pour les streams partenaires), visite
  quotidienne et calcul du streak en place,
  système de cartes à gratter en place (paliers et probabilités de gain
  provisoires, à valider avec le client), profil utilisateur et
  historique paginé des transactions de points en place, moteur de
  tirage au sort en place (job planifié BullMQ, graine aléatoire
  cryptographique journalisée pour l'audit, endpoints publics de
  consultation des tirages et des résultats), catalogue public des streams
  libres en place (`GET /streams`), avec marquage et bonus partenaires
  configurables par l'administrateur,
  temps réel WebSocket en place (Gateway Socket.io avec room publique
  bornée pour le compteur réel des inscrits et Gateway authentifiée par
  JWT pour les rooms privées, événements de points, de streak, de carte à
  gratter débloquée, de compteur d'inscrits et de résultat de tirage),
  l'API publique `GET /public/stats` servant la valeur persistée et le
  frontend la mettant à jour sans donnée fictive, appariement de
  l'extension navigateur en place (code à usage
  unique de courte durée généré depuis le site, échangé contre un jeton
  d'accès opaque et révocable propre à l'extension), gestion des
  appareils appariés en place (liste depuis le site, désappariement à la
  demande), rôle administrateur et garde d'accès back-office en place
  (`AdminGuard` réutilisable sur les futurs endpoints `/admin/*`, rôle
  exposé sur `GET /me`, désignation du premier administrateur réservée à
  une commande CLI serveur, aucune auto-élévation possible). Les fondations
  de gestion de contenu administrable sont en cours de livraison pour les
  brouillons, versions, publications, annonces et journaux d'audit. Les
  annonces peuvent être listées, modifiées et archivées par un administrateur
  sans suppression de leur trace opérationnelle.
- Frontend : scaffold Next.js + Tailwind opérationnel, design system
  gamer néon (palette, typographie, composants) en place, pages de
  connexion et d'inscription email/mot de passe en place (session portée
  par le cookie `httpOnly` du backend, rien n'est stocké côté client),
  catalogue public des streams libres en place. Le suivi du visionnage et le
  crédit des points passent par l&apos;extension navigateur. Page `/extension` de génération du code
  d'association de l'extension navigateur en place. Tableau de bord
  viewer en place (`/dashboard`) : solde de points, historique paginé,
  progression de série, cartes à gratter disponibles et tickets de
  tirage, avec mise à jour en direct du solde, de la série et des
  nouvelles cartes via le client WebSocket (Socket.io), rafraîchissement
  REST au chargement même si le WebSocket est indisponible.
- Extension navigateur : extension WebExtension Manifest V3 (Chrome) en
  place, avec permissions minimales (aucun accès à l'historique de
  navigation), détection de lecture sur les pages de direct Twitch,
  YouTube et Kick, association du compte par code à usage
  unique depuis la popup, et orchestration des sessions de visionnage
  (ouverture, heartbeats, clôture) dans le service worker. Le jeton
  d'appariement de l'extension est désormais accepté par les routes de
  visionnage : les sessions ouvertes depuis l'extension créditent des
  points (voir
  [extension/README.md](extension/README.md)).
- Infra : reverse proxy Traefik avec TLS automatique (Let's Encrypt) en
  place pour la production.

Suivi détaillé des fonctionnalités restantes dans
[docs/01-features.md](docs/01-features.md).

### Refonte dashboards premium 2.0

La refonte DASH-V3 des dashboards viewer et admin est cadrée sur une branche
dédiée. Elle supprime le header global historique, sépare les navigations par
contexte et définit une hiérarchie premium fondée sur la lisibilité, la densité
maîtrisée et le feedback explicite. Les documents de conception sont
[dashboard-redesign-2.0.md](docs/design/dashboard-redesign-2.0.md) et
[dashboard-wireframes-2.0.md](docs/design/dashboard-wireframes-2.0.md), complétés
par la [maquette HTML autonome](docs/design/dashboard-prototype-2.0.html).

La reprise corrective DASH-V3 applique une direction plus sobre aux shells viewer
et admin : surfaces bleu ardoise, contraste renforcé, accent violet réservé aux
actions et navigation admin unique. La validation inclut une inspection manuelle
des deux écrans déployés et le nettoyage des données de démonstration visibles.
L'implémentation historique est fusionnée dans `dev`. La refonte DASH-V3 radicale
est maintenant en cours sur une branche dédiée. Elle commence par l'audit de
tous les écrans, contenus et fonctionnalités, impose une source de vérité par
donnée, interdit les liens décoratifs et exige des états succès/vide/erreur
réellement fonctionnels. Voir [l'audit](docs/design/ux-003-audit.md),
[l'architecture cible](docs/design/ux-003-target-architecture.md) et le
[prototype fonctionnel](docs/design/ux-003-prototype.html).

La phase DASH-V3 suit désormais une séquence de gel du design avant la recette
fonctionnelle. La matrice écran par écran, les routes, les contrats attendus,
les états UI et les critères de gel sont regroupés dans
[dashboard-v3-design-freeze.md](docs/design/dashboard-v3-design-freeze.md).
La carte reste en développement tant que la relecture visuelle, la validation
mobile et la recette fonctionnelle complète ne sont pas prouvées.

Framer Motion fait partie de la stack frontend DASH-V3 (`frontend/package.json`).
Il doit être utilisé pour les transitions, les feedbacks et les micro-interactions
qui rendent les maquettes premium perceptibles, avec une variante respectueuse de
`prefers-reduced-motion`. Il ne sert pas à fabriquer des données, contourner les
contrats API ou remplacer un état fonctionnel. Toute nouvelle surface dashboard
doit donc être conçue avec ce langage de mouvement et documentée dans la
[direction visuelle](docs/design/visual-direction.md).

Le bloc stream du viewer affiche uniquement la miniature contractuelle fournie
par l’API ou, pour Twitch, la miniature publique dérivable de l’identifiant de
chaîne. En l’absence de source réellement accessible, l’interface conserve un
état de repli explicite et n’invente aucune image. Le catalogue DASH-V3 expose
des onglets et compteurs calculés depuis les plateformes reçues, une recherche,
un tri fondé sur les champs contractuels (favoris, nom, bonus et partenaire),
ainsi que les favoris locaux. Les filtres catégorie et langue restent visibles
mais désactivés tant que le contrat `/streams` ne fournit pas ces champs. Les
avatars, statuts LIVE et compteurs de spectateurs ne sont pas affichés car ils
ne sont pas présents dans le contrat actuel.

Le cockpit viewer affiche jusqu’à trois cartes du catalogue `/streams` dans la
surface de visionnage, afin de préserver une densité utile sans dupliquer ni
inventer de données. Chaque carte reste limitée aux champs contractuels de la
chaîne et renvoie vers le catalogue complet.

La page des tirages dérive également un temps restant à partir de la seule
date contractuelle `dateTirage` pour les tirages ouverts. Elle ne prétend pas
fournir de compte à rebours serveur ni d’information absente de l’API. Cette
information est annoncée dans une région `status` polie et atomique, actualisée
au maximum une fois par minute pour éviter de spammer les lecteurs d’écran.

## Démarrage rapide (Docker, tous les services)

```bash
cp .env.example .env   # ajuster les valeurs
docker compose up -d --build
```

## Démarrage rapide (backend)

```bash
cd backend
cp .env.example .env   # ou ajuster .env existant
npm install
npx prisma generate
npm run start:dev
```

## Démarrage rapide (frontend)

```bash
cd frontend
npm install
npm run dev
```

## Démarrage rapide (extension navigateur)

```bash
cd extension
npm install
npm run build          # produit extension/dist, à charger dans chrome://extensions
```

Détail de l'installation en mode développeur et des permissions demandées
dans [extension/README.md](extension/README.md).

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le gitflow et les conventions
de contribution.

La page récompenses affiche la progression vers le palier de série de la carte
sélectionnée à partir de `streakActuel` et `streakPalier`, sans créer d’état
verrouillé ou de gain absent du contrat API.

Le dashboard extension expose aussi le lien officiel Chrome Web Store dès
l’en-tête. Aucun lien Edge ou Firefox n’est affiché tant qu’aucune URL publiée
correspondante n’est fournie par le produit.
