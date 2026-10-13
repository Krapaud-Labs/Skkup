# Frontend Skkup

Application web Next.js de Skkup. Elle fournit l'interface gamer
néon, l'authentification par cookie de session et le visionnage des chaînes
partenaires.

## Démarrage

```bash
npm install
npm run dev
```

L'application est accessible sur <http://localhost:3000>. La passe responsive
isolée peut utiliser <http://localhost:3100>. L'API backend doit être
disponible à l'adresse définie par `NEXT_PUBLIC_API_URL`, et l'origine exacte
utilisée doit figurer dans `CORS_ORIGINS`.

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

La langue est actuellement choisie côté client entre FR et EN, avec le sélecteur
visible dans les en-têtes public et dashboard, sans variantes d'URL `/en` ni alternates `hreflang`. La métadonnée serveur et le sitemap sont
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
`fetchAuthentifie()`. La déconnexion passe par `POST /auth/logout`. Si une page protégée reçoit une réponse `401`, elle redirige automatiquement vers la vitrine `/`; la page `/connexion` reste accessible explicitement pour ouvrir une session.
L’inscription affiche le règlement avant les champs et transmet
`accepteReglement: true`; l’API refuse toute création sans cette acceptation.

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

La page `/faq` peut recevoir son titre, son introduction et ses questions via
`GET /content/FAQ/faq`. En cas d'erreur, de réponse vide ou d'entrée
incomplète, elle conserve le contenu statique local. Le changement de langue
annule l'application d'une réponse devenue obsolète.

## Tableau de bord et temps réel

Le cockpit principal admin possède une feuille `src/app/admin/cockpit.css`
limitée à sa racine. Elle rapproche la composition de la référence avec des
KPI horizontaux à 1280 px, un en-tête ouvert, des tableaux bord à bord et un
journal en chronologie. Les KPI passent à deux colonnes sous 1180 px puis à
une colonne à 767 px et moins. Le shell admin, sa navigation latérale et les
grilles de cartes suivent le même seuil de 767 px afin d'éviter une composition
intermédiaire à 767 px. Les panneaux restent dimensionnés par leur contenu,
afin qu'un journal plus fourni ne crée pas de vide artificiel dans les autres
zones. Les grilles se replient sous 1100 px. Les seuils KPI sont des
breakpoints de viewport, scoped au cockpit principal : quatre colonnes à
1280 px, deux sous 1180 px et une à 767 px et moins. La largeur utile restante
après la sidebar ne déclenche donc pas à elle seule un repli tablette. Ces
seuils sont portés par la feuille du cockpit et ne sont pas remplacés par les
garde-fous partagés de `globals.css` à 1280 px. Les données et actions
conservent les contrats API existants ; les écrans secondaires sont indépendants.

La régression responsive rendue est couverte par
`e2e/dashboard-v3-cockpit-breakpoints.spec.ts` : elle charge les deux feuilles CSS et
contrôle les colonnes du cockpit à 1280, 768, 767 et 320 px, ainsi qu'une
grille d'écran secondaire. Le garde-fou partagé de `globals.css` exclut
explicitement le cockpit principal, ce qui rend le résultat indépendant de
l'ordre de bundling des feuilles CSS.

Le cockpit administrateur `/admin` utilise exclusivement le résumé API
`/admin/dashboard/summary`. Sa grille V3 présente les indicateurs, tirages,
lots, contenus, signalements et activités avec des états neutres lorsque le
contrat ne fournit pas de type, d'image ou d'identité. Les descriptions réelles
des tirages ouverts sont rendues sous leur titre. Aucun contenu de démonstration
n'est injecté côté interface. Le panneau éditorial rend aussi jusqu'à deux
ressources `contents` réelles avec leur slug, locale, statut et version, afin
de retrouver la densité de la référence admin sans inventer de titre, de média
ou de métrique absente du résumé.

La route `/admin/lots` conserve une table d’inventaire dense avec les médias,
la valeur estimée réelle, le fournisseur, le stock, le statut et le tirage
associé issus de `LotAdmin`. Aucun type de lot ou descriptif absent du contrat
n’est fabriqué par l’interface. À largeur mobile, ces mêmes champs deviennent
des lignes étiquetées afin de rester lisibles sans débordement.
Les liens de synthèse conservent aussi l’identifiant du contenu sélectionné afin
que la page de gestion ouvre le même contenu, sans retomber sur le premier
élément de la bibliothèque.

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
Le préfixe REST éventuel (`/api`) reste séparé du point d'entrée Socket.IO : le
client utilise l'origine de l'API et le chemin `/socket.io`, ce qui maintient le
handshake fonctionnel derrière le proxy Docker local comme en déploiement.

Le shell viewer porte désormais une navigation persistante unique vers les
parcours `/dashboard`, `/dashboard/streams`, `/dashboard/tirages` et
`/dashboard/reglement`, ainsi que le menu compte dans l'espace privé. Le

La navigation latérale DASH-V3 conserve une emprise commune de `2.8rem` pour
les pictogrammes viewer et admin, flex-basis inclus. Cette règle empêche les
sélecteurs responsive spécifiques de comprimer les icônes et maintient le
rendu sans cadre attendu par les références.
À la connexion quotidienne, le dashboard enregistre automatiquement la visite
La session web est réévaluée côté serveur au changement de journée : un ancien
cookie est refusé et l'utilisateur est redirigé vers `/connexion` avant de
pouvoir obtenir le bonus du jour. La session de l'extension est indépendante.
via `POST /me/daily-checkin`; aucun bouton de validation manuelle n'est exposé.
Le backend reste idempotent et refuse un second crédit le même jour. Le
dashboard expose aussi l'ouverture réelle des cartes à gratter, avec retour de
gain et mise à jour du solde. Les annonces restent
présentées dans une modale accessible, fermable par le bouton, un clic extérieur
ou la touche Échap.

Après une inscription à une loterie, une validation automatique ou l'ouverture d'une carte,
les tickets et l'historique sont rechargés depuis l'API et les actions déjà
consommées sont désactivées. Une erreur de catalogue streams propose un retry
REST dédié. Ces garanties évitent les compteurs périmés et les doubles actions.

Les miniatures de streams utilisent d'abord `thumbnailUrl` fourni par l'API.
Pour Twitch uniquement, une miniature publique est dérivée de l'identifiant
réel de chaîne afin de récupérer l'image du stream ; YouTube et Kick restent
sur le fallback neutre tant qu'un identifiant vidéo contractuel n'est pas fourni.

Sur `/dashboard/tirages`, la date `dateTirage` du contrat `GET /raffles` est
utilisée telle quelle. Un tirage ouvert affiche le temps restant recalculé
chaque minute dans la liste et le détail, avec une annonce accessible. Les
tirages clos ou publiés conservent leur date localisée, sans inventer de
compteur absent de l'API.

Le parcours d'extension présenté dans le dashboard est limité à Chrome en V1.

La page `/dashboard/extension` regroupe désormais l'installation, les étapes
d'appariement, le code de liaison, les plateformes compatibles et les règles de
confidentialité dans un bloc principal. L'état d'appariement reste rendu par
`CodeAppariement` afin de conserver ses états indépendants, ses erreurs et son
rafraîchissement temps réel. Le smoke test responsive couvre les variantes
françaises et anglaises sur 390 px et 1280 px.
Les plateformes de validation affichées sont Twitch, YouTube et Kick.

Les panneaux d'appariement et d'appareils associés utilisent deux colonnes de
largeur égale sur desktop et s'étirent à la même hauteur. Ils restent empilés
sous le breakpoint desktop afin de préserver la lisibilité mobile.

Les trois cartes d'étapes disposent également d'une marge homogène avec le
bloc principal, d'un espacement interne régulier et d'une bordure complète.

Le bouton d'installation Chrome du dashboard reste compact, sans symbole
décoratif, tout en conservant son nom accessible et son lien sécurisé vers le
Chrome Web Store.

Le shell viewer principal applique aussi une direction dédiée DASH-V3 : fond
bleu nuit, panneaux à contraste renforcé, halos violet/cyan, grille KPI stable
et cartes média dimensionnées pour la composition de la maquette desktop. Les
breakpoints réduisent cette composition en une colonne sans masquer les actions.
La page principale ne duplique plus le catalogue dans un bloc « Temps de
visionnage ». Le catalogue reste accessible depuis la navigation et sa page
dédiée, tandis que le dashboard conserve uniquement les informations de
progression, d'extension, de récompenses, de tirages et d'activité utiles à
l'utilisateur.
Le hero viewer reprend maintenant une hiérarchie dédiée avec l’asset de points
existant, tandis que les états vides de l’historique et des tickets conservent
une composition structurée avec une action vers le parcours réel concerné.
Ces éléments n’ajoutent aucune donnée métier : ils utilisent uniquement les
réponses déjà fournies par les contrats et des textes d’orientation statiques.
La meilleure série reste fournie par le profil, mais n'encombre plus la rangée
KPI principale, qui suit désormais la composition à trois cartes de la maquette.
Le shell des espaces viewer et admin occupe toute la fenêtre : le rail et le
contenu n'utilisent plus de cadre externe flottant, et le contenu central
s'étend ou se replie selon la largeur disponible. Sous 900 px, les deux
navigations refluient en grille de liens dans le shell au lieu de défiler
horizontalement. Les libellés restent accessibles à 320 px comme à 768 px et
les pictogrammes conservent une emprise de 2,8 rem sans cadre décoratif.
Le cockpit admin principal conserve maintenant une hiérarchie dédiée pour son
hero, ses KPI et ses panneaux d’activité. Quand un contrat renvoie zéro élément,
les panneaux affichent un état vide structuré et un lien vers l’action réelle
correspondante, sans fabriquer de contenu ou de compteur.
Les transitions d'entrée du dashboard principal utilisent Framer Motion avec une
durée courte et respectent la réduction des mouvements via les préférences du
navigateur.

### Framer Motion dans DASH-V3

`framer-motion` est une dépendance de conception obligatoire pour les surfaces
DASH-V3. Elle doit être utilisée pour les transitions d'entrée, les changements
d'état des panneaux, les feedbacks d'action et les micro-interactions qui
renforcent la hiérarchie visuelle des maquettes. Les données, les mutations et
les permissions restent pilotées par les contrats API et ne doivent jamais être
simulées par une animation. Chaque nouvel écran doit documenter son mouvement,
son état initial et sa version `prefers-reduced-motion` dans la spécification
design correspondante.

Dans l'inventaire administrateur `/admin/lots`, l'URL HTTPS d'une miniature
réelle de lot est facultative : lorsqu'elle est absente, l'interface affiche
l'icône neutre Skkup et l'enregistrement reste possible. Une image n'est
jamais inventée côté client. Si l'URL contractuelle ne charge pas, le même
fallback neutre est affiché et annoncé comme indisponible.

La surface viewer 2.0 complète ces parcours avec les routes
/dashboard/recompenses, /dashboard/historique, /dashboard/compte et
/dashboard/extension. Les récompenses regroupent les cartes, tickets et
tirages à partir des réponses API existantes; l'historique utilise la
pagination des transactions; le compte affiche le profil et la sécurité;
l'extension génère le code temporaire d'appariement. Ces écrans séparent les
états de chargement, vide et erreur et n'inventent aucune donnée métier.

La page publique `/extension` réserve une colonne suffisamment large au bloc
d'appariement sur desktop afin que le texte, le code temporaire et le bouton
restent lisibles. La grille repasse en une colonne sur les largeurs plus
étroites. Le lien d'installation pointe vers la fiche officielle du Chrome
Web Store et le statut des appareils reste issu du contrat d'appariement.

Le centre Récompenses utilise `GET /me/rewards-summary?limit=6` pour afficher
un instantané cohérent des cartes à gratter, tickets, transactions et
métriques du profil. Les pages d'historique détaillé continuent d'utiliser
les endpoints paginés. En cas d'échec de l'agrégat, l'interface affiche un
état d'erreur explicite et permet de réessayer, sans données fictives.

## Gestion éditoriale administrateur

Les écrans DASH-V3 `/admin/announcements` et `/admin/audit` utilisent une
composition dense master-detail responsive. Les onglets, filtres, indicateurs,
révisions et chronologies sont calculés uniquement à partir des contrats API
(`announcements`, `history` et `audit`). Une réponse vide reste affichée comme
un état vide explicite, sans auteur, version, média ou événement inventé.

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
La structure du rail admin est alignée sur celle du viewer : même conteneur de
liens, même alignement des icônes, mêmes états actifs et même comportement
responsive, sans modifier les routes ni les fonctionnalités d'administration.
Les repères visuels des deux espaces passent par `SkkupIcon`, le composant
partagé qui garantit un langage d’icônes cohérent et testable en responsive.
La vitrine publique conserve les pictogrammes SVG inline en passant
`preferSvg` à `SkkupIcon`. Les assets générés restent réservés aux usages qui
les demandent explicitement, notamment certains éléments des dashboards.
Le changement de langue de la vitrine est accessible uniquement dans le menu
du compte lorsqu’un profil est connecté, et n’est plus affiché dans la barre
d’en-tête publique.
Dans ce menu, le sélecteur FR/EN est présenté comme une préférence de compte
compacte, avec le code de langue actif, son libellé explicite et un focus visible.
Le focus natif rose est neutralisé sur le selecteur lui-même afin de conserver
uniquement l’état cyan du contrôle englobant, sans perdre la visibilité clavier.
La liste des appareils associés se met à jour automatiquement via Socket.IO
après une association ou une révocation. Le bouton « Actualiser l’état » reste
disponible comme solution de secours si la connexion temps réel est absente.
L'ancien chemin `/dashboard/admin` redirige vers `/admin`. L'accès est
également contrôlé côté client par le rôle de la session ; un viewer est
redirigé vers son dashboard et un utilisateur non authentifié vers la
vitrine `/`. Un administrateur retrouve aussi le lien vers `/admin` dans le
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
n'est encore disponible. Le règlement rappelle aussi que le suivi et les
points dépendent exclusivement de l'extension officielle sur navigateur web
de bureau, les supports non compatibles ne générant aucun point.

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
constituent désormais des écrans autonomes. Les routes `/admin/announcements`
et `/admin/content` montent respectivement `AnnouncementsAdminV3` et
`GestionContenu`, afin d'exposer directement la bibliothèque master-detail,
les filtres éditoriaux, l'éditeur, les versions et l'audit fournis par les
contrats réels. Elles chargent les contrats API
réels et exposent leurs actions métier, filtres, états vides et erreurs. La
modération reste accessible sur `/admin/moderation` avec sélection d'un dossier,
preuves, chronologie et qualification.

L'écran `/admin/users` complète cette composition avec quatre indicateurs, des
filtres par recherche, rôle et statut, puis une sélection master/detail. La fiche
sélectionnée expose uniquement les champs et compteurs renvoyés par l'API et
permet l'activation ou la désactivation via le contrat administrateur. Aucun
profil ou compteur de démonstration n'est injecté côté frontend.

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
L'identité visuelle des lots affiche l'URL `imageUrl` renvoyée par le contrat
administrateur lorsqu'elle existe. En l'absence d'image dans les données, elle
utilise l'icône Skkup `gift` versionnée comme repli accessible, sans texte ou
image inventé.
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

L'icône `ticket` réutilise le pictogramme SVG versionné
`/public/branding/v3/ticket.svg` dans les KPI, les récompenses, les états
vides et les pages de tirages. Le registre `SkkupIcon` centralise ce choix pour
éviter des variantes visuelles entre les écrans.

Le dashboard viewer V3 ne présente plus de panneau d’annonces. Les annonces et
contenus éditoriaux restent gérés depuis l’espace admin et leurs routes dédiées;
le viewer conserve uniquement les parcours prévus par la maquette premium.

L'état vide de la collection Récompenses conserve une surface visuelle dédiée,
un message explicite et une hiérarchie cohérente avec la maquette, sans créer de
carte ou de récompense qui ne serait pas renvoyée par le backend.

## Variable d'environnement

- `NEXT_PUBLIC_API_URL` : URL de base de l'API backend, appelée directement
  depuis le navigateur. Valeur par défaut : `http://localhost:3001`. Le build
  Docker la transmet à Next.js et ajoute automatiquement son origine HTTP et
  WebSocket à la directive CSP `connect-src`.

Pour le déploiement Dokploy de production, cette variable doit cibler
`https://api.skkup.fr`. Le domaine `https://api-staging.skkup.fr` est réservé
à la préproduction et ne doit pas être embarqué dans le frontend public.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Tests navigateur

Les jobs CI ciblent les labels Linux génériques des runners auto-hébergés du projet afin que les deux runners VPS disponibles puissent exécuter les contrôles en parallèle.

La configuration Playwright laisse jusqu'à 30 secondes aux assertions de visibilité du shell et 60 secondes à chaque scénario afin d'absorber la compilation à froid, l'hydratation Next.js et le parcours clavier complet lorsque le runner exécute la suite avec un seul worker. Le parcours clavier focalise tous les nœuds rendus dans une seule évaluation navigateur puis vérifie `document.activeElement`, pour éviter que l'attente d'actionability de Playwright ne masque le résultat sur les runners VPS.

Le contrôle `npm run test:e2e` lance un smoke test Chromium sur ordinateur et mobile. La matrice live DASH-V3 couvre les 14 routes déclarées aux largeurs 320, 768 et 1280 px, ainsi qu'un contrôle paysage avec zoom 200 %. Elle vérifie l'absence de débordement horizontal, la présence d'un titre accessible, les noms des contrôles, leur focus, les labels de champs, les alternatives des images, le respect de `prefers-reduced-motion` et, sur les contrôles tactiles explicites, une zone minimale de 44×44 px. Les preuves live authentifiées nécessitent `QA_BASE_URL` et soit `QA_EMAIL`/`QA_PASSWORD`, soit `QA_STORAGE_STATE` pointant vers une session QA existante. Avec un storage state, aucun login ni secret n'est généré et la session est réutilisée telle quelle. Pour la stack Docker locale, `docker-compose.override.yml` peut publier les routes HTTPS sur `https://localhost` et `/api`; définir `QA_LOCAL_HTTPS=1` pour accepter le certificat local dans Playwright. La CI lance aussi ce smoke test sans cible QA externe, sur un port isolé, afin de toujours tester le frontend issu du commit contrôlé et d'éviter les collisions avec un déploiement déjà présent sur le runner.

La fixture de `responsive-accessibility.spec.ts` normalise les routes API
directes (`/me`) et celles servies derrière le proxy Docker (`/api/me`) ; le
même contrôle de visite automatique peut donc être rejoué avec le frontend
local ou la stack HTTPS Docker.

La suite `dashboard-viewer-main-live.spec.ts` couvre également le dashboard
principal viewer aux trois largeurs comparables 320, 768 et 1280 px. Elle
capture le shell, les KPI, la zone de streams contractuelle ou son état vide,
les contrôles nommés, le focus et l'absence de débordement. Elle ne fabrique
aucune donnée et nécessite une session QA authentifiée.

Les règles responsive admin sont strictement limitées au shell admin et ont été vérifiées pour 1280, 768 et 320 px. Elles empilent les espaces de travail, transforment les lignes d'inventaire et utilisateurs en cartes lisibles et empêchent les actions ou libellés essentiels de sortir de l'écran, sans modifier le viewer ni le contrat métier.

La pagination, les onglets et les lignes sélectionnables de `/admin/moderation`, ainsi que les onglets utilisateurs, imposent une zone d'action minimale de 44×44 px, y compris pour les boutons précédent et suivant, afin de respecter la cible tactile sur tous les viewports.

Le lot DASH-V3 des écrans admin secondaires renforce la densité des KPI, la
hiérarchie des filtres et des listes master/detail, les badges de priorité, les
médias disponibles et les chronologies d'audit/modération. Il reste limité aux
valeurs déjà renvoyées par l'API : les états vides, les métadonnées absentes et
les preuves non disponibles restent explicitement affichés. Les règles sont
scopées aux routes secondaires et ne modifient ni les contrats ni le cockpit
admin principal.

Les écrans secondaires viewer reprennent cette hiérarchie visuelle pour les
streams, récompenses, historique et extension : cartes média, filtres,
master/detail, états de chargement, vide et erreur, ainsi que les adaptations
mobile. Les styles n'ajoutent aucun champ métier ; les valeurs et les états
restent ceux des contrats déjà chargés par chaque écran.

Le hero du dashboard utilisateur utilise le logo S transparent sans cadre ni
pièce décorative. Le logo n'est plus répété dans la barre supérieure, où le
menu du compte reste le point d'accès à l'identité et aux actions du profil.

Le lot admin final applique la même fidélité aux références du cockpit, des
tirages, des lots et des annonces/contenus : densité des KPI, hiérarchie des
actions, médias disponibles et états explicites. Il reste limité aux données
API déjà rendues et ne change aucun contrat métier.

À 320 px, les cartes d'inventaire `/admin/lots` conservent maintenant une
colonne média et une grille compacte pour les métadonnées et les actions. Le
champ de type reste explicitement absent lorsque le contrat API ne le fournit
pas.

La carte mobile place également les métadonnées sur toute la largeur et les
actions sur une ligne dédiée afin d'éviter les libellés verticaux et les
débordements à 320 px.

Prérequis : installer Chromium avec `npx playwright install chromium` avant la première exécution locale.

Pour conserver les captures d'une campagne live hors du dossier nettoyé par
Playwright, définir `QA_CAPTURE_DIR`, par exemple
`QA_CAPTURE_DIR=../docs/quality/evidence/dash-v3-final-captures/post-3a27445`.
Les blocs du dashboard n'affichent pas de chevrons décoratifs. Les liens d'accès restent visibles avec leur libellé afin de préserver la navigation et l'accessibilité.

Les dashboards restent chargés par l'API au démarrage, puis invalident automatiquement leurs sections concernées lorsqu'un événement WebSocket de points, de série, de carte, de tirage ou d'inscription utilisateur est reçu. Aucun bouton de rafraîchissement manuel n'est requis pour ces changements.
