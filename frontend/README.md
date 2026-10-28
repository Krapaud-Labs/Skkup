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

Les icônes d'interface sont servies au format PNG par le registre
`src/components/ui/SkkupIcon.tsx`; leurs sources sont dans
[`../asset/icons/ui/`](../asset/icons/ui/). Les illustrations Skkup de
récompenses et d'extension se trouvent dans
[`../asset/dashboard/illustrations/`](../asset/dashboard/illustrations/) et ne doivent être utilisées que pour
un contenu de sens correspondant et une taille qui préserve leur lisibilité.
Le composant n'ajoute pas de calque S aux icônes. Exception propriétaire,
`points.png` est la monnaie fournie avec son emblème S déjà intégré; les autres
pictogrammes ne reçoivent pas de marque superposée. Le pack runtime comprend
29 PNG RGBA transparents
de 1254 × 1254 px qui utilisent les noms du registre. Le premier lot accepté
présente des objets à faces blanches, des biseaux argentés et des halos de
lumière diffus roses et violets, sans contour coloré. Le mapping, la matrice
des fonds observés, les règles
d'accessibilité et la référence visuelle sont documentés dans
`../docs/design/dashboard-icon-usage.md`.
`next/image` optimise les PNG à la demande pour les tailles d'affichage des
composants; les sources haute résolution demeurent inchangées. Le runtime
standalone inclut Sharp pour le traitement local des images.
Pour le glyphe `points`, la pièce fournie par le propriétaire a été restylée en
blanc/argent avec halo rose-violet; le S reste intégré à la pièce. Le fichier
runtime est `asset/icons/ui/points.png` (RGBA, 1254 × 1254 px). Les
tailles `sizes` des KPI admin, des navigations et de la topbar points suivent
leurs dimensions CSS responsives afin que l'optimiseur ne serve pas une source
trop petite.

Les blocs viewer utilisent les illustrations PNG de récompense et d'extension
lorsque leur taille et leur contenu s’y prêtent. La série actuelle utilise le
pictogramme fonctionnel `flame`; l'ancienne illustration de série a été retirée.
L’état vide Cartes à gratter de l’accueil viewer utilise le glyphe
`scratchCard` rose/violet; l’illustration `rewardIllustration` reste utilisée par
`CentreRecompenses` et les priorités Lots admin.
La grille
propriétaire définit la cible blanc/rose/violet sans calque du S. Le propriétaire
a confirmé l'acceptation du rendu du premier lot et demandé de conserver son
style; voir
[`dashboard-icon-usage.md`](../docs/design/dashboard-icon-usage.md) et les
résultats de vérification liés. Le thème CSS des pages est distinct des pixels
des icônes.

La palette néon Skkup et les composants réutilisables (`CarteGlow`,
`BoutonCTA`, `BandeauStats`, `BarreProgressionStreak`) vivent dans
`src/components/ui/`, avec leurs tokens définis dans `src/app/globals.css`.
Les surfaces bleues profondes et les accents violet/cyan gardent l'identité
néon dans un équilibre sobre et lisible.
Les espaces Viewer et Administration utilisent le même cadre React
`src/components/dashboard/DashboardFrame.tsx` et les mêmes tokens, surfaces et
traitements de navigation. Le Viewer définit les choix visuels communs; chaque
espace garde sa navigation, ses permissions et ses commandes métier.
Les deux accueils partagent aussi une surface d’introduction: hiérarchie du
titre et du sous-titre, marque Skkup et séparation des indicateurs. Les KPI
d’administration restent des liens opérationnels distincts, mais sont intégrés
dans la surface hero comme les statistiques Viewer.
Sur desktop, son retrait horizontal reprend le padding responsive du contenu
Viewer (`clamp(1.25rem, 3vw, 3.75rem)`); sous 850 px, il suit le retrait mobile
du Viewer tandis que les panneaux opérationnels Admin gardent leur largeur.
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
L’inscription affiche d’abord le règlement dans un modal accessible et bloque
l’accès aux champs tant que l’utilisateur n’a pas coché l’acceptation puis
confirmé l’action. Le formulaire révèle ensuite les champs et transmet
`accepteReglement: true`; l’API refuse toute création sans cette acceptation.
Le scénario Playwright d'inscription simule aussi `GET /me` après création :
l'application navigue vers `/dashboard` et le sas conserve la session pendant
le chargement du tableau de bord.

Le contrat complet est décrit dans `docs/04-api-contract.md`.

À l’inscription, le mot de passe doit contenir au moins 12 caractères, une
majuscule, une minuscule, un chiffre et un symbole. Les contraintes sont
affichées en temps réel en français et en anglais, puis vérifiées également
par l’API. Le formulaire affiche directement les indicateurs détaillés sans
répéter une phrase d’aide redondante.

## Streams et suivi par extension

La page `/streams` charge le catalogue public avec `GET /streams`. Le site ne
reproduit pas les directs. L'utilisateur ouvre la plateforme de son choix et
l'extension Skkup suit le visionnage.

Les plateformes du MVP sont Twitch, YouTube et Kick. Les entrées Facebook
historiques de la réponse API sont écartées du catalogue viewer; aucune
session de visionnage n'est ouverte depuis ce catalogue pour Facebook.

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
une colonne à 767 px et moins. Viewer et admin utilisent le même cadre:
colonne de navigation fluide `clamp(14rem, 15vw, 16rem)`, bornée avec
`min-width: 0`, sur desktop; le rail se replie au-dessus du contenu sous 900 px.
Les liens sont sur deux colonnes jusqu'à 600 px, puis sur une colonne. Le contenu
ne reçoit pas de padding latéral admin ajouté. Les panneaux restent
dimensionnés par leur contenu,
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

La typographie des titres, surfaces et accents partagés du cockpit admin
`/admin` suit les tokens et l’échelle du Viewer. La densité métier reste
spécifique à l’admin: les colonnes des tables, les indicateurs compacts et les
métadonnées gardent leurs tailles adaptées, avec un plancher de .75 rem. Les
libellés longs des tableaux, signalements et activités peuvent revenir à la
ligne, et les actions peuvent s'enrouler dans leur bouton. Les CTA primaires
reprennent le dégradé violet vers `--color-accent-cta`, la forme capsule et
l'ombre au survol de `BoutonCTA` Viewer; leur hauteur reste adaptée à la
densité admin. Les actions de ligne utilisent la variante secondaire sur
surface relevée. Cette règle doit être vérifiée aux largeurs 320,
390, 768, 1280 et 1440 CSS px, puis au zoom 200 % et au reflow 400 % depuis
1280 CSS px; seules les tables explicitement bidimensionnelles peuvent défiler
horizontalement.

Les panneaux de données du viewer et du cockpit `/admin` gardent une hauteur
de contenu responsive indépendante du nombre de lignes: listes viewer de 8 à
12 rem (historique jusqu'à 15.75 rem, grille des cartes à gratter de 11 à 17
rem), et tables/listes cockpit de 11 à 18 rem. Les listes viewer de lots,
tickets, historique et cartes à gratter, ainsi que les tables, signalements et
activités du cockpit, défilent à l'intérieur avec une barre violette; les
en-têtes et actions de panneau restent hors du défilement, et les en-têtes de
table restent fixes. La grille des cartes à gratter n'apparaît que lorsqu'elle
contient des cartes; les états vides/loading gardent leur hauteur naturelle.
Dans ce panneau, la colonne de titre peut rétrécir et le sous-titre long revient
à la ligne dans la largeur disponible, y compris sur écran étroit.
Les zones scrollables ont un nom accessible et peuvent recevoir le focus pour
le défilement clavier. La table de lots admin garde une grille à quatre
colonnes, avec défilement interne sur les largeurs où son contenu ne tient pas.
Ces règles sont limitées aux deux dashboards principaux; les routes secondaires
ne changent pas.

Le cockpit administrateur `/admin` utilise exclusivement le résumé API
`/admin/dashboard/summary`. Sa grille V3 présente les indicateurs, tirages,
lots, contenus, signalements et activités avec des états neutres lorsque le
contrat ne fournit pas de type, d'image ou d'identité. Les descriptions réelles
des tirages ouverts sont rendues sous leur titre. Aucun contenu de démonstration
n'est injecté côté interface. Le panneau éditorial rend aussi jusqu'à deux
ressources `contents` réelles avec leur slug, locale, statut et version, afin
de retrouver la densité de la référence admin sans inventer de titre, de média
ou de métrique absente du résumé.
Dans la composition desktop de `/admin`, l’action de l’état vide Signalements
se place sous son texte lorsque le panneau est étroit. Le tableau Tirages
conserve des colonnes lisibles et défile à l’intérieur de son panneau si sa
largeur dépasse l’espace disponible; la zone est accessible au clavier.

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
Le bloc des cartes à gratter conserve le détail des cartes disponibles et
utilisées, mais n’affiche pas de compteur total redondant dans son en-tête.
Dans le carousel viewer, chaque zone illustrée reprend le ratio naturel du
ticket. Le groupe ticket/palier/bouton est centré dans la carte fixe pour éviter
le letterbox vertical; l’image conserve son ratio et reste entièrement visible,
sans fond ni ombre ajoutés. La marge transparente basse varie selon le palier;
elle est compensée proportionnellement à la largeur de l’illustration afin que
le bord visible reste à la même distance du palier sans rogner le PNG.
Le bandeau viewer reste fixé en haut pendant le défilement et n’y répète pas le
solde de points déjà présent dans les KPI. Le bloc du prochain tirage affiche
les lots et l’action d’inscription sans répéter la date ni le nombre de tickets
du compte. Le titre d’activité reprend le libellé violet des autres blocs, et
les marges latérales de la zone principale sont équilibrées sur écran large.
L’activité récente occupe toute la largeur disponible, associe une icône au
type de transaction et conserve l’icône pièce devant chaque montant.
Les blocs du dashboard ne proposent pas de liens rapides de consultation dans
leurs en-têtes ou leurs états vides. La navigation reste portée par le menu
latéral, tandis que les boutons métier nécessaires restent visibles dans leur
contenu.
La carte « Extension à associer » n’est pas affichée sur cette page principale.
L’association et la gestion de l’extension restent disponibles depuis
`/dashboard/extension`, le compte et les parcours concernés.
Les montants de l’activité récente utilisent le PNG officiel du S-coin commun
aux points, avec le signe et la valeur conservés dans le même contrôle visuel.
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

Les états de chargement du sas viewer et du dashboard admin utilisent le même
composant accessible et responsive. Le compteur de membres inscrits n'est pas
affiché sur la vitrine ; cette donnée reste réservée à l'administration.

Sur mobile, la navigation admin et les filtres des annonces restent utilisables
sans élargir la page; les filtres peuvent défiler horizontalement. Le popover
Notifications viewer se cale dans le viewport et limite sa hauteur à l'espace
visible. Dans l'administration, une erreur de chargement n'est pas présentée
comme une liste vide; la récupération passe par l'action Réessayer.

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
confidentialité dans un bloc principal, sans en-tête redondant ni icône décorative
au-dessus des étapes. L'état d'appariement reste rendu par
`CodeAppariement` afin de conserver ses états indépendants, ses erreurs et son
rafraîchissement temps réel. Le smoke test responsive couvre les variantes
françaises et anglaises sur 390 px et 1280 px.
Les plateformes de validation affichées sont Twitch, YouTube et Kick.

Le bloc d'activité récente du dashboard viewer présente ses cartes sur trois
colonnes sur grand écran, puis deux et une colonne aux largeurs réduites.

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
Sous 900 px, le centre empile explicitement sa collection, son solde, ses
tickets, son guide et la carte sélectionnée dans une seule colonne pour éviter
les placements de grille implicites qui recouvriraient les actions. Le test
Playwright mobile vérifie que le bouton reçoit bien les événements tactiles et
ouvre le modal. Le parcours de carte prépare d'abord la récompense, puis la
révèle après grattage manuel ou automatique; le test fonctionnel suit ce flux
et sa notification. Le masque de grattage est propre à chaque illustration et
suit les limites de la feuille argentée, y compris les découpes dues aux objets
de premier plan et au coin pelé. Chaque `scratch-tier-*-foil-mask.png` est un
masque alpha aux dimensions natives de son ticket, extrait de la feuille
argentée du PNG correspondant. Le même masque est appliqué au voile et au
montant dans le navigateur, et sa couche alpha définit les pixels comptés pour
le seuil de 90 %. Le montant est placé dans cette feuille sans libellé
supplémentaire de gain. `scratch-card-mask.test.ts` compare chaque masque au
plus grand composant argenté neutre détecté dans son PNG source.
Les cinq fichiers sont explicitement autorisés par la liste de la route
`/assets/*`. `src/app/assets/[...path]/route.test.ts` vérifie pour chacun une
réponse GET 200, le type PNG et une longueur non nulle. En runtime, la route
sert directement ces images depuis le dossier racine `asset/`.

## Gestion éditoriale administrateur

Les écrans DASH-V3 `/admin/announcements` et `/admin/audit` utilisent une
composition dense master-detail responsive. Les onglets, filtres, indicateurs,
révisions et chronologies sont calculés uniquement à partir des contrats API
(`announcements`, `history` et `audit`). Une réponse vide reste affichée comme
un état vide explicite, sans auteur, version, média ou événement inventé.
Au-dessus de 900 px, les colonnes de texte de la bibliothèque sont flexibles
et la colonne « Action » garde une largeur minimale explicite. Le layout
annonces passe en une colonne jusqu’à 1150 px pour préserver la place des
libellés. Les onglets gardent leur largeur intrinsèque dans une rangée
défilable, afin que le libellé « Archivées » reste accessible même lorsque la
rangée dépasse son conteneur. Le scénario Playwright vérifie l’en-tête, chaque
cellule, « Ouvrir » et l’accès au dernier onglet aux largeurs 1100, 1101, 1200,
1280, 1300 et 1301 px avec une fixture API. Il couvre ces viewports en rendu
local, sans prétendre valider chaque largeur ni une API déployée.

Les espaces sont séparés par rôle. `/dashboard` est réservé au parcours
viewer et utilise `DashboardSas` avec le menu du pseudo comme point d'accès.
Ce menu regroupe l'identité, la navigation et l'accès au profil; le changement
de mot de passe se gère dans `/dashboard/compte` (« Mon compte »).

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
Sur desktop, le cadre partagé suit la largeur fluide du Viewer:
`clamp(14rem, 15vw, 16rem)`, soit de 224 à 256 px, sans padding extérieur.
Après le rebuild, la QA a vérifié que les deux shells sont alignés à 1920 px
(rail 256 px, contenu x=304) et 1280 px (rail 224 px, contenu x=262). À 768,
390 et 320 px, elle n’a relevé ni débordement ni collision et a confirmé la
navigation empilée. Seule une session d’authentification mock a été utilisée;
l’authentification réelle n’est pas couverte par cette preuve. Sous 900 px, la
navigation passe au-dessus du contenu; sous 600 px, ses liens s'empilent sur
une colonne.
Les cartes, panneaux et données admin réutilisent également les surfaces, les
bordures, les rayons, la typographie et l'accent violet des tokens runtime
viewer. La densité de l'administration reste préservée; vert, ambre et rouge
restent réservés aux états sémantiques. Toute modification de thème doit être
comparée dans un navigateur sur `/dashboard` et les routes `/admin` aux tailles
desktop, tablette et mobile; les captures locales fixture ne valent pas preuve
de déploiement ni approbation du design global.
Les repères visuels des deux espaces passent par `SkkupIcon`, le composant
partagé qui rend les glyphes PNG du registre à la taille demandée. La vitrine,
le viewer et l’administration utilisent le même
registre; aucun pictogramme SVG inline n’est rendu côté frontend.
Les bénéfices affichés sur les pages de connexion et d’inscription réutilisent
les assets points et ticket du même registre, sans cadre décoratif additionnel.
L’en-tête de la vitrine conserve uniquement le logo et l’action ou le menu du
compte. Les liens de navigation publics ne sont pas affichés, que la session
soit active ou non.
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

Le registre `SkkupIcon` rend les 29 pictogrammes d’interface en PNG optimisés
depuis `asset/icons/ui/`. Les fichiers source sont carrés, transparents et en
haute résolution; `next/image` les adapte à la taille d’affichage sans modifier
les originaux. `points`, `ticket` et `ticketIllustration` rendent chacun une
seule image PNG. Le fichier points conserve l'emblème intégré dans la source
propriétaire; `SkkupIcon` n'ajoute aucune image S en surimpression. Les logos
de plateforme, le fichier de marque S séparé et les illustrations métier restent
des sources distinctes. Le pictogramme `cube`
non rendu a été supprimé; le KPI admin Lots utilise maintenant `gift`.
Dans `BandeauStats`, les PNG KPI `points`, `flame` et `ticket` déclarent une
taille source de 48 × 48 px et partagent la classe d’image sans cadre; les
autres icônes du bandeau gardent leur taille de 22 px.

Les anciens alias overview, devices, dailyVisit, content, moderation, singleUse
et spark sont rabattus sur le glyphe voisin qui décrit la même action. Le bouton
« Comment ça marche » réutilise `streams`, qui représente déjà un lecteur avec
son triangle Play rose. Le PNG fonctionnel `flame` est utilisé pour le KPI
« Série actuelle » du viewer et les notifications de série. Les pastilles
d’état dynamiques restent pilotées par les données et le CSS.
Les anciens PNG métier `daily-visit` (sans emplacement dédié) et
`scratch-card` (copie exacte du ticket S, sans usage runtime) ont été supprimés;
le pictogramme compact `scratchCard` de `asset/icons/ui` reste utilisé.

Les logos Twitch et YouTube sont rasterisés fidèlement depuis leurs sources de
marque officielles en PNG transparents 128 × 128 pour les vues runtime. Kick
garde son libellé texte. Les SVG officiels source restent dans
`asset/platforms`, mais aucun composant frontend ne les charge.
La pièce points reprend l'image fournie par le propriétaire dans une version
restylée blanc/argent avec halo rose-violet, dans `asset/icons/ui/points.png`.
Son URL `SkkupIcon` porte le préfixe du SHA comme fragment (`#v=211758f7`)
pour invalider une ancienne variante Next Image en cache après un remplacement
du PNG. Mettre à jour ce fragment lorsque le fichier change.
Son emblème S reste intégré; le composant rend cette seule image, sans ajouter
de calque. Les visuels de vitrine continuent d’utiliser leurs images
dédiées et leurs textes alternatifs.

Les images source du site sont toutes centralisées dans le dossier racine
`asset/`. La route Next `/assets/*` les sert directement; aucun dossier
`public/` n'est utilisé pour les médias. La carte des dossiers est dans
[`../asset/README.md`](../asset/README.md).

Le dashboard viewer V3 ne présente pas de panneau d’annonces dans son contenu.
Les annonces publiées sont consultées dans le menu Notifications du viewer,
chargées depuis `GET /viewer/announcements` à l’ouverture puis par curseur
(`{ items, nextCursor }`) avec « Charger plus ». Le défilement reste interne
au menu. Ce contrat requiert une session de rôle `VIEWER`, inclut les annonces
activées planifiées ou expirées et exclut les annonces archivées/non publiées.
Une sélection ouvre un modal accessible affichant le titre et le texte brut;
les annonces n’ont ni compteur, ni état de lecture, ni événements WebSocket.
Cliquer sur le backdrop ne ferme pas le modal et conserve le focus dans le
dialogue; Tab et Shift+Tab restent confinés à ses contrôles.
Les notifications temps réel historiques du dashboard (points, série, carte
et extension) restent indépendantes et continuent d’utiliser leurs événements.
La gestion et l’historique des annonces restent dans l’espace admin.

Les tests unitaires ciblés couvrent le chargement, la navigation clavier,
le maintien du focus après interaction avec le backdrop, l’absence de compteur,
le contenu texte brut et la taille minimale du bouton de fermeture. Ils valident
la logique du composant dans Vitest/jsdom, pas le focus ou le rendu calculé dans
un navigateur. Le contrôle CSS lit la feuille depuis la racine du package afin
de rester compatible avec le résolveur de modules de Vitest.

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
capture les sections actuelles du dashboard, les KPI, les PNG effectivement
chargés, les contrôles nommés, le focus et l'absence de débordement. Elle ne
mocke pas l'API et nécessite une session authentifiée ainsi que des données déjà
présentes dans la cible. Pour tester la stack Docker publiée sur l'hôte local,
utiliser le même nom d'hôte `localhost` pour `QA_BASE_URL` et l'API afin que le
cookie de session host-only soit partagé entre les ports du frontend et du
backend. Le seed `local:seed-demo` prépare un volume de données réaliste sans
remplacer les comptes existants.

Les règles responsive admin sont strictement limitées au shell admin et ont été vérifiées pour 1280, 768 et 320 px. Elles empilent les espaces de travail, transforment les lignes d'inventaire et utilisateurs en cartes lisibles et empêchent les actions ou libellés essentiels de sortir de l'écran, sans modifier le viewer ni le contrat métier.

La pagination, les onglets et les lignes sélectionnables de `/admin/moderation`, ainsi que les onglets utilisateurs, imposent une zone d'action minimale de 44×44 px, y compris pour les boutons précédent et suivant, afin de respecter la cible tactile sur tous les viewports.

Le lot DASH-V3 des écrans admin secondaires renforce la densité des KPI, la
hiérarchie des filtres et des listes master/detail, les badges de priorité, les
médias disponibles et les chronologies d'audit/modération. Il reste limité aux
valeurs déjà renvoyées par l'API : les états vides, les métadonnées absentes et
les preuves non disponibles restent explicitement affichés. Les règles sont
scopées aux routes secondaires et ne modifient ni les contrats ni le cockpit
admin principal.

La page d'ensemble admin expose le titre de section et le titre du cockpit dans
son shell. Les contrôles live vérifient désormais qu'un titre visible existe
dans le shell au lieu d'imposer un nombre global de `h1` identique à celui du
viewer.

Les écrans secondaires viewer reprennent cette hiérarchie visuelle pour les
streams, récompenses, historique et extension : cartes média, filtres,
master/detail, états de chargement, vide et erreur, ainsi que les adaptations
mobile. Les styles n'ajoutent aucun champ métier ; les valeurs et les états
restent ceux des contrats déjà chargés par chaque écran.

Le hero du dashboard utilisateur utilise le logo S transparent sans cadre ni
pièce décorative. Le logo n'est plus répété dans la barre supérieure, où le
menu du compte reste le point d'accès à l'identité et aux actions du profil.

Les images de la section « Comment ça marche » de la vitrine n'affichent plus
de badge superposé indiquant une génération par IA. Chaque image conserve son
texte alternatif descriptif pour les technologies d'assistance.

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

La cloche du dashboard présente les annonces paginées depuis l'API et conserve les notifications temps réel de points, de série, de carte à gratter et d'appariement. Les confirmations d’actions viewer, comme le pointage quotidien, l’ouverture d’une carte ou l’inscription à un tirage, passent par un événement typé interne : la topbar les ajoute à la liste temps réel de la cloche et affiche un toast accessible pendant cinq secondes. Un résultat informatif comme une inscription déjà enregistrée utilise également le toast. La même topbar reçoit les confirmations transitoires des actions d’administration, comme enregistrer du contenu, modifier une annonce ou gérer un lot ou un compte. Les erreurs serveur qui demandent une action de correction restent près de l’action concernée, ainsi que les états de chargement et de validation. Les résultats métier à conserver, comme le hash de vérification d’un tirage exécuté, restent affichés dans leur section; le toast y ajoute une confirmation courte. Les événements WebSocket restent indépendants des annonces.

Le dashboard viewer regroupe désormais le hero de progression et ses trois indicateurs dans un même conteneur visuel. Les indicateurs restent séparés par des panneaux internes et s'empilent automatiquement sur les petits écrans.

Les retours de succès et les résultats informatifs des actions des dashboards
viewer et administrateur apparaissent sous la rangée du header, alignés au
bord droit du menu de compte, et sont ajoutés à la liste temps réel de la
cloche Notifications. Le toast s’annonce avec `aria-live`, disparaît
automatiquement et ne modifie pas la hauteur du hero ou des cartes du dashboard.

La carte « Prochain tirage » du dashboard viewer ne présente que le tirage
ouvert : aperçu des deux premiers lots au maximum, date, participation au
tirage courant et inscription. Un lien mène à la page des tirages pour voir
les lots restants. La description détaillée reste sur cette page afin que la
carte du dashboard reste concise. Le total global de tickets demeure dans le
KPI dédié et les participations archivées dans leur écran dédié. Sur desktop,
la carte Tirage s’ajuste à la hauteur naturelle de Récompenses sans étirer son
voisin et sans défilement interne. Sous 850 px, les deux cartes reprennent leur
hauteur naturelle dans la pile mobile.

Le bandeau KPI conserve le fond bleu uniquement dans chaque carte statistique. Le conteneur du bandeau reste transparent afin d'éviter tout débordement visuel autour des bordures arrondies.

La navigation latérale des dashboards utilise une colonne fluide commune de
`clamp(14rem, 15vw, 16rem)` sur desktop. Sous 900 px, elle passe au-dessus du
contenu avec des liens en grille, puis sur une colonne sous 600 px.

## Cycle des annonces

L’écran admin `src/components/admin/AnnouncementsAdminV3.tsx` consomme le statut
explicite `DRAFT`, `PUBLISHED` ou `ARCHIVED` renvoyé par l’API. Il crée les
annonces en brouillon, publie par action séparée, archive sans suppression et
restaure depuis le dernier événement d’archive non encore restauré. Après la
création, la publication, l’archivage et la restauration, l’interface recharge
l’historique API; une réponse tardive ne remplace pas l’historique de l’annonce
sélectionnée entre-temps. Cela évite de réutiliser un ancien événement et garde
les transitions visibles dans la chronologie. Les modifications de contenu ne
changent pas le statut; les annonces archivées ne sont pas éditables. Le champ
historique `actif` reste un alias de compatibilité et n’est pas la source d’état
de l’interface.

Le dashboard viewer continue de charger les annonces paginées avec
`GET /viewer/announcements`; l’API réserve cette route au rôle viewer et ne
renvoie que les annonces publiées. Les dates futures ou passées ne masquent pas
une annonce publiée. Cela est distinct du flux public historique
`GET /announcements/active`.

Les tests ciblés se lancent depuis `frontend/` avec
`npm test -- src/components/admin/AnnouncementsAdminV3.test.tsx`; ils couvrent
les actions via clients API simulés et ne prouvent pas la persistance backend.

## Illustrations des tickets à gratter

Les cinq illustrations `asset/dashboard/rewards/scratch-tier-*.png` représentent
des tickets physiques avec encoches, zone argentée à gratter et motifs de
streaming néon. Le S Skkup est généré dans chaque PNG à partir de la
référence de marque, sans collage du fichier logo.
Le mapping utilisé par le dashboard et le centre Récompenses est : Bronze à
3 jours, Silver à 7 jours, Gold à 14 jours, Platinum à 30, 40 et 50 jours, puis
Émeraude au-delà de 50 jours. Les URLs sont versionnées pour forcer le
rechargement des nouvelles images. Les vues de cartes conservent le ratio du
ticket et affichent le PNG entier sans fond coloré ni recadrage. Dans le modal,
la zone argentée propre à chaque palier reçoit seule le canvas de grattage et la
révélation du gain; seul le montant ou le résultat est affiché une seule fois
dans la feuille, sans doublon dans le hint et sans libellé possessif. Les textes
d’aide et de validation restent neutres. La position et la taille de texte sont ajustées
par illustration au centre de la feuille argentée et restent confinées au même
masque alpha natif, utilisé par le voile et le calcul du grattage. Le seuil
visuel de 90 %, le grattage manuel et le grattage automatique
restent conservés. Le dashboard n’ajoute pas de rangée vide quand
la carte n’a pas de gain textuel, afin de rapprocher le palier du bouton. Le
modal ne redessine pas de bordure autour du cadre déjà présent dans le PNG. La
planche de prévisualisation est dans
`docs/design/scratch-card-mockups/tiers-proposal-sheet.png`.

Le carousel du dashboard conserve une hauteur fixe. Son état vide centre son
contenu; quand plusieurs cartes sont disponibles, une scrollbar horizontale
violet-magenta permet de les parcourir sans étirer les tickets. Les cartes
restent entières et le bouton conserve une piste assez haute pour garder un
espacement régulier autour du palier.
