# Frontend Skkup

Application web Next.js de Skkup. Elle fournit l'interface gamer
néon, l'authentification par cookie de session et le visionnage des chaînes
partenaires.

## Démarrage

```bash
npm install
npm run dev
```

L'application est accessible sur <http://localhost:3000>. L'API backend doit
être disponible à l'adresse définie par `NEXT_PUBLIC_API_URL`.

Le frontend utilise une pile de polices système afin que le build et le rendu
initial ne dépendent pas d'un téléchargement depuis Google Fonts.

## Référencement naturel

Les routes publiques déclarent leurs métadonnées et leur URL canonique. Les
routes privées (`/connexion`, `/inscription`, `/dashboard` et `/admin`) sont
marquées `noindex` et les mêmes zones sont exclues de `robots.txt`. Le sitemap
est généré par Next.js pour les routes publiques effectivement disponibles.
La page d'accueil expose uniquement les données structurées vérifiables
(`Organization` et `WebSite`) ; aucune note, promesse commerciale ou donnée
non prouvée n'est ajoutée.

La langue est actuellement choisie côté client entre FR et EN, sans variantes
d'URL `/en` ni alternates `hreflang`. La métadonnée serveur et le sitemap sont
donc en français jusqu'à la mise en place d'une architecture URL localisée.
La validation Search Console, les métriques de performance réelles et la
soumission externe restent hors du contrôle du build.

## Design system

La palette « gamer néon » et les composants réutilisables (`CarteGlow`,
`BoutonCTA`, `BandeauStats`, `BarreProgressionStreak`) vivent dans
`src/components/ui/`, avec leurs tokens définis dans `src/app/globals.css`.
La vitrine utilise un fond mauve éclairci pour améliorer la lisibilité tout en
conservant des surfaces contrastées et des accents néon.
Voir `docs/06-frontend-design-system.md` pour la spécification complète.

## Authentification

Les pages `/connexion` et `/inscription` partagent le composant
`src/components/auth/FormulaireAuth.tsx` et s'appuient sur
`src/lib/auth.ts`.

La session n'est pas stockée par le frontend. `POST /auth/login` et
`POST /auth/register` ne renvoient que `{ pseudo }` et posent le jeton dans un
cookie `httpOnly`, inaccessible au JavaScript de la page. Les requêtes
authentifiées utilisent `credentials: "include"` par l'intermédiaire de
`fetchAuthentifie()`. La déconnexion passe par `POST /auth/logout`.

Le contrat complet est décrit dans `docs/04-api-contract.md`.

À l’inscription, le mot de passe doit contenir au moins 12 caractères, une
majuscule, une minuscule, un chiffre et un symbole. Les contraintes sont
affichées en temps réel en français et en anglais, puis vérifiées également
par l’API.

## Streams et suivi par extension

La page `/streams` charge le catalogue public avec `GET /streams`. Le site ne
reproduit pas les directs. L'utilisateur ouvre la plateforme de son choix et
l'extension Skkup suit le visionnage.

Le lecteur YouTube communique avec l'iframe par `postMessage`. Les messages
entrants sont acceptés uniquement s'ils proviennent de l'origine YouTube et de
la fenêtre de l'iframe attendue. Lorsqu'une lecture démarre, le hook
`useSessionVisionnage` :

1. ouvre une session avec `POST /watch-sessions` ;
2. envoie un heartbeat toutes les 30 secondes pendant la lecture ;
3. affiche les points éventuellement confirmés par le backend ;
4. clôt la session au démontage ou au changement de chaîne.

Le comptage est suspendu lorsque l'onglet passe en arrière-plan, même si le
lecteur continue techniquement à jouer la vidéo.

Le backend reste seul responsable de la validation temporelle, de
l'anti-fraude et du crédit des points. Par sécurité, la source lecteur
embarqué ne crédite aucun point tant qu'une attestation de plateforme
vérifiable côté serveur n'est pas disponible.

## Tableau de bord et temps réel

Le cockpit administrateur `/admin` utilise exclusivement le résumé API
`/admin/dashboard/summary`. Sa grille V3 présente les indicateurs, tirages,
lots, contenus, signalements et activités avec des états neutres lorsque le
contrat ne fournit pas de type, d'image ou d'identité. Aucun contenu de
démonstration n'est injecté côté interface.

La page `/dashboard` (`src/components/dashboard/TableauDeBord.tsx`) affiche
le solde de points, l'historique paginé, la progression de série, les cartes
à gratter disponibles et les tickets de tirage de l'utilisateur connecté.
Elle charge ces données par l'API REST au montage puis se connecte à la
Gateway temps réel (`src/lib/temps-reel.ts`, Socket.io) pour recevoir les
événements `points:updated`, `streak:updated` et `scratch-card:unlocked` de
sa room privée. Les événements qui ne contiennent pas une ressource complète
déclenchent un rechargement REST afin de ne jamais fabriquer de carte ou de
date côté navigateur. Le WebSocket est un confort : une connexion absente ou
coupée laisse la page utilisable avec les données déjà chargées.

Le shell viewer porte désormais une navigation persistante unique vers les
parcours `/dashboard`, `/dashboard/streams`, `/dashboard/tirages` et
`/dashboard/reglement`, ainsi que le menu compte dans l'espace privé. Le
dashboard expose aussi le check-in quotidien et l'ouverture réelle des cartes
à gratter, avec retour de gain et mise à jour du solde. Les annonces restent
présentées dans une modale accessible, fermable par le bouton, un clic extérieur
ou la touche Échap.

Après une inscription à une loterie, un check-in ou l'ouverture d'une carte,
les tickets et l'historique sont rechargés depuis l'API et les actions déjà
consommées sont désactivées. Une erreur de catalogue streams propose un retry
REST dédié. Ces garanties évitent les compteurs périmés et les doubles actions.

Les miniatures de streams utilisent d'abord `thumbnailUrl` fourni par l'API.
Pour Twitch uniquement, une miniature publique est dérivée de l'identifiant
réel de chaîne afin de récupérer l'image du stream ; YouTube et Facebook restent
sur le fallback neutre tant qu'un identifiant vidéo contractuel n'est pas fourni.

Le shell viewer principal applique aussi une direction dédiée DASH-V3 : fond
bleu nuit, panneaux à contraste renforcé, halos violet/cyan, grille KPI stable
et cartes média dimensionnées pour la composition de la maquette desktop. Les
breakpoints réduisent cette composition en une colonne sans masquer les actions.
La meilleure série reste fournie par le profil, mais n'encombre plus la rangée
KPI principale, qui suit désormais la composition à trois cartes de la maquette.
Les transitions d'entrée du dashboard principal utilisent Framer Motion avec une
durée courte et respectent la réduction des mouvements via les préférences du
navigateur.

Dans l'inventaire administrateur `/admin/lots`, l'URL HTTPS d'une miniature
réelle de lot est facultative : lorsqu'elle est absente, l'interface affiche
l'icône neutre Skkup et l'enregistrement reste possible. Une image n'est
jamais inventée côté client.

La surface viewer 2.0 complète ces parcours avec les routes
/dashboard/recompenses, /dashboard/historique, /dashboard/compte et
/dashboard/extension. Les récompenses regroupent les cartes, tickets et
tirages à partir des réponses API existantes; l'historique utilise la
pagination des transactions; le compte affiche le profil et la sécurité;
l'extension génère le code temporaire d'appariement. Ces écrans séparent les
états de chargement, vide et erreur et n'inventent aucune donnée métier.

Le centre Récompenses utilise `GET /me/rewards-summary?limit=6` pour afficher
un instantané cohérent des cartes à gratter, tickets, transactions et
métriques du profil. Les pages d'historique détaillé continuent d'utiliser
les endpoints paginés. En cas d'échec de l'agrégat, l'interface affiche un
état d'erreur explicite et permet de réessayer, sans données fictives.

## Gestion éditoriale administrateur

Les espaces sont séparés par rôle. `/dashboard` est réservé au parcours
viewer et utilise `DashboardSas` avec le menu du pseudo comme point d'accès.

Le shell viewer et le cockpit administrateur utilisent une direction visuelle
calme et dense : navigation unique, surfaces ardoise, accent violet limité aux
états actifs, KPI lisibles et priorités opérationnelles visibles. Toute évolution
UX doit être contrôlée dans un navigateur sur `/dashboard` et `/admin`, y compris
les états vides, les erreurs, les reprises et les actions mutantes.
`/admin` utilise
`AdminSas` et `NavigationAdmin` pour les fonctions d'administration, avec la
même identité visuelle mais des actions, liens et contrôles distincts.
Les repères visuels des deux espaces passent par `SkkupIcon`, le composant
partagé qui garantit un langage d’icônes cohérent et testable en responsive.
L'ancien chemin `/dashboard/admin` redirige vers `/admin`. L'accès est
également contrôlé côté client par le rôle de la session ; un viewer est
redirigé vers son dashboard et un utilisateur non authentifié vers la
connexion. Un administrateur retrouve aussi le lien vers `/admin` dans le
menu de son pseudo.

La section de gestion de contenu du dashboard admin permet à un administrateur
non développeur de visualiser une réplique de chaque page éditoriale. Chaque
bloc est cliquable et ouvre une modale contenant le contenu déjà présent. Les
pages légales et informatives utilisent des sections avec titre et contenu, la
FAQ utilise des paires question-réponse et les médias disposent de champs
dédiés. Chaque contenu peut être enregistré en brouillon, publié ou dépublié.
L'historique permet de consulter les versions et de restaurer une version
comme nouveau brouillon.
Après chargement, le premier contenu réel est sélectionné automatiquement afin
que l’aperçu admin ne retombe pas sur un bloc générique lorsqu’une page existe.

Le back-office expose aussi l’exécution contrôlée d’un tirage : l’administrateur
fournit la graine et l’entropie publique, confirme l’opération irréversible, puis
retrouve le statut et l’empreinte dans l’historique. Aucun bouton de tirage ne
doit être affiché sans ces données et cette confirmation.

Lors de la première ouverture du module, les pages déjà présentes dans la
vitrine sont importées comme brouillons éditoriaux : règlement, politique de
confidentialité et FAQ, dans les langues disponibles. L'administrateur peut
ainsi les sélectionner immédiatement sans les recréer.

L’éditeur admin permet maintenant de modifier séparément les titres de
sections, les questions/réponses FAQ et les métadonnées média (URL, texte
alternatif et légende). Les enregistrements et changements de publication
affichent un état d’exécution, désactivent les actions concurrentes et
retournent un message de succès ou d’erreur.

Les pages publiques FAQ, politique de confidentialité et règlement chargent
le contenu publié correspondant dans la langue sélectionnée. Le contenu
historique intégré reste disponible comme repli lorsqu'aucune version publiée
n'est encore disponible.

Un audit UX indépendant des dashboards viewer et administrateur est suivi dans
`docs/audits/90-audit-dashboards-ux.md`. Les rendus navigateur, les états vides,
les états d'erreur et les différences avant/après doivent être vérifiés avant
la livraison finale.

La refonte UX-003 poursuit cet audit avec une architecture cible et un
prototype fonctionnel dans `docs/design/ux-003-target-architecture.md` et
`docs/design/ux-003-prototype.html`. Chaque lien ou action ajouté doit avoir un
comportement réel et être testé en succès, état vide et erreur.

Les routes administrateur `/admin/raffles`, `/admin/lots`,
`/admin/announcements`, `/admin/content`, `/admin/users` et `/admin/audit`
constituent désormais des écrans autonomes. Elles chargent les contrats API
réels et exposent leurs actions métier, filtres, états vides et erreurs. La
modération reste accessible sur `/admin/moderation` avec sélection d'un dossier,
preuves, chronologie et qualification.

Le parcours `/dashboard/streams` ne répète plus son bloc d’introduction : le
titre et la promesse restent portés par l’en-tête de page, puis le catalogue
affiche directement ses filtres, ses cartes et ses liens externes réels.
Lorsqu'une entrée `GET /streams` fournit `thumbnailUrl`, la carte affiche cette
miniature HTTPS réelle ; sinon elle conserve l'icône de catalogue. Le frontend
ne génère ni ne présente jamais une image fictive comme miniature de stream.
La même règle s'applique au stream mis en avant du dashboard viewer, avec
retour automatique à l'icône si le chargement de la source échoue.

Le journal `/admin/audit` utilise une composition V3 master/detail : filtres
par action et entité, liste sélectionnable et panneau de preuve affichant les
métadonnées du contrat. Il reste honnête lorsque l'API ne renvoie aucun
événement et ne fabrique pas d'activité de démonstration.

L’inventaire `/admin/lots` suit la composition V3 table + panneau d'action :
recherche, filtre de stock, création, modification via `PATCH`, suppression
confirmée et messages d'état sont raccordés aux contrats administrateur. Aucun
aperçu ou lot fictif n'est généré lorsque l'API ne renvoie pas de données.
L'identité visuelle des lots utilise l'icône Skkup `gift` versionnée, et non un
symbole générique.
Pendant le chargement, l'inventaire expose explicitement son état d'attente et
désactive la recherche afin de distinguer une requête en cours d'un inventaire
réellement vide.

L'éditeur `/admin/announcements` expose également les fenêtres réelles de
publication (`debutAt` et `finAt`) contrôlées par le backend. Les dates sont
envoyées sur les créations et modifications, puis rechargées depuis le contrat
lorsqu'une annonce est sélectionnée ; aucune planification locale ne contourne
la validation serveur.

Pour la recette visuelle admin, une fixture locale explicitement préfixée
`qa_dashv3_` peut être chargée dans la base Docker. Elle sert uniquement à
exercer la fiche tirage non vide dans Chrome et ne doit jamais être créée dans
un environnement de production.

La route `/admin/raffles` utilise une composition master/detail V3 avec
préparation dérivée des données API, lots associés, règles réellement exposées,
contrôle cryptographique et historique vérifiable. Aucun tirage, lot ou compteur
n'est fabriqué pour remplir l'interface ; l'état vide reste explicite.

La route `/admin/users` expose également une composition V3 dédiée : KPI dérivés
du résultat API, filtres rôle/statut, recherche et table d’actions conservant la
mutation réelle d’activation/désactivation.

Les KPI du dashboard viewer utilisent désormais les icônes Skkup versionnées
(`points`, `flame`, `ticket`) au lieu d'un symbole générique, afin de conserver
la hiérarchie visuelle des maquettes sans modifier les valeurs issues de l'API.

L'état vide de la collection Récompenses conserve une surface visuelle dédiée,
un message explicite et une hiérarchie cohérente avec la maquette, sans créer de
carte ou de récompense qui ne serait pas renvoyée par le backend.

## Variable d'environnement

- `NEXT_PUBLIC_API_URL` : URL de base de l'API backend, appelée directement
  depuis le navigateur. Valeur par défaut : `http://localhost:3001`. Le build
  Docker la transmet à Next.js et ajoute automatiquement son origine HTTP et
  WebSocket à la directive CSP `connect-src`.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
## Tests navigateur

Le contrôle `npm run test:e2e` lance un smoke test Chromium sur ordinateur et mobile. La matrice live DASH-V3 couvre les 14 routes déclarées aux largeurs 320, 768 et 1280 px, ainsi qu'un contrôle paysage avec zoom 200 %. Elle vérifie l'absence de débordement horizontal, la présence d'un titre accessible, les noms des contrôles, leur focus, les labels de champs, les alternatives des images, le respect de `prefers-reduced-motion` et, sur les contrôles tactiles explicites, une zone minimale de 44×44 px. Les preuves live authentifiées nécessitent `QA_BASE_URL` et ne sont pas simulées localement.

Prérequis : installer Chromium avec `npx playwright install chromium` avant la première exécution locale.
