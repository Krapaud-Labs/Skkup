# Skkup

Plateforme communautaire qui récompense les viewers de streams Twitch,
YouTube et Kick pour leur visite quotidienne et leur temps de visionnage.
Les points gagnés servent de tickets de participation à des tirages au sort
réguliers, avec de vrais lots à la clé.

## Sommaire

- [Présentation](#présentation)
- [État du projet](#état-du-projet)
- [Structure du dépôt](#structure-du-dépôt)
- [DASH-V3](#dash-v3)
- [Démarrage rapide](#démarrage-rapide)
- [Documentation](#documentation)

## Présentation

La documentation complète du projet (vision, spécifications
fonctionnelles, architecture, modèle de données, sécurité, design system,
CI/CD, Docker, gitflow, conformité légale) se trouve dans
[docs/](docs/00-overview.md).

La cartographie ACT-03 des catégories de données, champs implémentés et
mécanismes de cycle de vie est documentée dans
[docs/03-data-model.md](docs/03-data-model.md); les validations de conservation
et de conformité y restent explicitement ouvertes. L’inventaire ACT-09 des
médias, ressources locales et preuves de provenance est suivi dans
[docs/design/media-inventory.md](docs/design/media-inventory.md); les éléments
non établis y restent signalés comme tels.

La CI de livraison s'exécute via GitHub Actions sur `ubuntu-latest`. Aucun
runner VPS n'est requis pour les Pull Requests.

Un contrôle GitHub Actions planifié vérifie également la disponibilité de
l'API et du frontend publics chaque heure. Un échec produit un run GitHub en
échec et le signal d'alerte standard des notifications du dépôt.

## État du projet

Le socle backend, frontend, extension et infrastructure est opérationnel.
Les fonctionnalités encore en évolution sont signalées dans les sections
ci-dessous et dans la documentation détaillée.

### Structure du dépôt

```text
docs/           Documentation du projet (voir docs/00-overview.md)
backend/        API NestJS + Prisma (PostgreSQL)
frontend/       Application Next.js + Tailwind (design system en place)
extension/      Extension navigateur WebExtension MV3 (Chrome en V1.0)
infra/          Fichiers d'infrastructure complémentaires
docker-compose.yml           Topologie Docker de base (voir docs/08-docker-infra.md)
docker-compose.override.yml  Dev local (ports directs, chargé automatiquement)
docker-compose.prod.yml      Production (TLS Traefik/Let's Encrypt, routage par domaine)
docker-compose.dokploy.yml   Déploiement Dokploy (frontend et API via domaines TLS séparés)
CONTRIBUTING.md              Gitflow, conventions de commits et de code
```

### Backend et API

Le backend NestJS et Prisma utilise PostgreSQL et fournit notamment :

- l'authentification par e-mail et mot de passe avec cookie de session
  `httpOnly` et protection anti-CSRF ;
- les sessions de visionnage et la validation anti-fraude des heartbeats ;
- la visite quotidienne et le calcul du streak ;
- les cartes à gratter, les tickets et le moteur de tirage au sort ;
- le catalogue public des streams libres ;
- les mises à jour temps réel Socket.io pour les données du dashboard ;
- l'appariement et la révocation des appareils de l'extension ;
- les rôles et les endpoints d'administration.

Les fondations de gestion de contenu administrable sont en cours de livraison
pour les brouillons, versions, publications, annonces et journaux d'audit. Le
cycle cible des annonces distingue `DRAFT`, `PUBLISHED` et `ARCHIVED`; la
création en brouillon, la publication explicite et la migration des annonces
historiques sont documentées dans
[la conception du cycle de vie](docs/design/announcement-lifecycle-2026-10-22.md).
Cette conception n'affirme pas que le cycle est déjà implémenté.

### Application frontend

Le frontend Next.js et Tailwind fournit :

- les pages publiques, la connexion et l'inscription ;
- le catalogue des streams libres ;
- la page d'association de l'extension ;
- le dashboard viewer avec points, historique, streak, cartes à gratter et
  tickets de tirage ;
- les mises à jour WebSocket et le repli REST au chargement.

### Extension de visionnage

L'extension WebExtension Manifest V3 pour Chrome assure :

- la détection de lecture prévue sur Twitch, YouTube et Kick (cible MVP décidée) ; le support actuellement présent dans le code de l’extension couvre Twitch, YouTube et Facebook : Kick reste à intégrer et Facebook est hors cible ;
- l'association du compte par code à usage unique ;
- l'ouverture, les heartbeats et la clôture des sessions de visionnage ;
- le crédit des points après validation côté serveur.

Voir [extension/README.md](extension/README.md) pour les permissions et
l'installation.

### Infrastructure et CI

- reverse proxy Traefik avec TLS automatique pour la production ;
- déploiement Docker compatible avec Dokploy ;
- CI de livraison exécutée par GitHub Actions sur `ubuntu-latest` ;
- contrôle planifié de disponibilité de l'API et du frontend publics.

La version de référence des métadonnées de maintenance du dépôt est vérifiée
chaque semaine. Une vérification peut aussi être déclenchée manuellement depuis
GitHub Actions, sur la branche `dev`. Lorsqu'une nouvelle version est détectée,
une Pull Request vers `dev` propose uniquement la mise à jour de cette
métadonnée ; aucune dépendance applicative ni fonctionnalité du produit n'est
modifiée. Ces contrôles nécessitent l'accès aux GitHub Actions du dépôt et aux
permissions du dépôt permettant de proposer une Pull Request. Ils ne mettent
pas à jour automatiquement le code applicatif et ne garantissent pas
l'intégration de la Pull Request.

Seuls les numéros de version au format `MAJOR.MINOR.PATCH` sont acceptés. La
mise à jour échoue si la valeur distante ne respecte pas ce format.

### Kit de contribution

Le dépôt consomme le kit Agentic partagé en version `1.16.89`, déclarée dans
`.workspace.toml`. À l'ouverture d'une session, `session-start-gate.sh`
vérifie les instructions et l'état d'exécution. Si
`.codex/RUNTIME-STATE.md` manque, `bootstrap-runtime-state.sh` restaure le
modèle avant la validation du Goal; il ne réinitialise pas le brief, le profil,
les work items, les rapports ou les fichiers produit. Le synchroniseur garde
le kit local et consigne l'action suivante si GitHub est inaccessible. Ce
dispositif concerne les sessions de contribution et ne modifie pas le runtime
de l'application Skkup.

Suivi détaillé des fonctionnalités restantes dans
[docs/01-features.md](docs/01-features.md).

## DASH-V3

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

## Démarrage rapide

### Docker, tous les services

```bash
cp .env.example .env   # ajuster les valeurs
docker compose up -d --build
```

Ouvrir ensuite `http://localhost:3000/inscription` pour créer un compte. En
local, le frontend appelle l'API sur `http://localhost:3001` sans certificat
TLS. La base persiste dans le volume Docker du projet Compose; pour isoler un
nouvel environnement sans toucher à une base existante, utiliser un nom de
projet distinct, par exemple `docker compose -p skkup-local-test up -d --build`.

### Backend

```bash
cd backend
cp .env.example .env   # ou ajuster .env existant
npm install
npx prisma generate
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Extension navigateur

```bash
cd extension
npm install
npm run build          # produit extension/dist, à charger dans chrome://extensions
```

Pour l'installation en mode développeur et le détail des permissions, voir
[extension/README.md](extension/README.md).

## Documentation

La documentation complète du projet, incluant la vision, les spécifications,
l'architecture, la sécurité, le design system, la CI/CD, Docker, Gitflow et
la conformité légale, se trouve dans [docs/](docs/00-overview.md).

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le gitflow et les conventions
de contribution.

La page récompenses affiche la progression vers le palier de série de la carte
sélectionnée à partir de `streakActuel` et `streakPalier`, sans créer d’état
verrouillé ou de gain absent du contrat API.

Le dashboard extension expose aussi le lien officiel Chrome Web Store dès
l’en-tête. Aucun lien Edge ou Firefox n’est affiché tant qu’aucune URL publiée
correspondante n’est fournie par le produit.

La modération admin affiche le pseudo et l’e-mail déjà renvoyés par le contrat
des signalements dans la file et le détail. Aucun identifiant ou contact n’est
reconstitué côté interface.
