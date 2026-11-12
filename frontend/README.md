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
[`assets/icons/ui/`](assets/icons/ui/). L'illustration Skkup de l'extension se
trouve dans [`assets/dashboard/illustrations/`](assets/dashboard/illustrations/).
L'illustration de récompense qui figurait auparavant dans ce dossier a été
retirée du runtime le 2026-11-03; les vues récompenses utilisent le pictogramme
`scratchCard` et les visuels propres aux cartes.
Le composant n'ajoute pas de calque S aux icônes. Exception propriétaire,
`points.png` est la monnaie fournie avec son emblème S déjà intégré; les autres
pictogrammes ne reçoivent pas de marque superposée. Le pack runtime comprend
29 PNG RGBA transparents de 1254 × 1254 px qui utilisent les noms du registre.
Depuis le 2026-11-09, leurs pixels sont monochromes blanc/argent: chaque valeur
RGB est égale et l’alpha d’origine est conservé octet pour octet. Le S intégré
à `points.png` est préservé. Le premier rendu rose/violet reste archivé dans
`../docs/archive/design/ui-icons-before-neutral-2026-11-09.tar.gz`. Le mapping,
la méthode déterministe de recoloration, la matrice des fonds observés et les
règles d'accessibilité sont documentés dans
`../docs/design/dashboard-icon-usage.md`.
Pour régénérer le pack depuis les originaux, extraire l’archive puis lancer le
script depuis la racine du dépôt. Sharp est fourni par Next.js; le script écrit
et valide les PNG dans `/private/tmp`, sans écraser les fichiers runtime:

```bash
mkdir -p /private/tmp/skkup-icons-original /private/tmp/skkup-icons-neutral
tar -xzf docs/archive/design/ui-icons-before-neutral-2026-11-09.tar.gz -C /private/tmp/skkup-icons-original --strip-components=1
node frontend/scripts/recolor-ui-icons-neutral.mjs /private/tmp/skkup-icons-original /private/tmp/skkup-icons-neutral
```

Le log confirme les dimensions, l’absence de chroma RGB et l’alpha identique
pour chaque icône. Les noms et chemins runtime restent inchangés; les PNG de
marque/plateforme et les illustrations ne sont pas traités par ce script.
Exception de marque demandée le 2026-11-09 : les actifs dans
`assets/brand/marks/` utilisent l’image Skkup fournie par le propriétaire. Les
trois PNG ont une toile RGBA 1254 × 1254 et sont strictement identiques. Le mark
a été recentré par translation de pixels `dx=-49, dy=-48`, sans redessin ni
recoloration. La boîte alpha ≥16 passe de `x=173..1179, y=96..1253` à
`x=124..1130, y=48..1205`; aucun pixel à ce seuil n'est coupé. Seuls 5 161
pixels d'alpha 1/255 au bord sortent de la toile. Le favicon ICO conserve sa
toile 64 × 64; son mark a été translaté de `dx=-2, dy=-2` et seuls deux pixels
d'alpha 1/255 sont coupés. La palette violet/rose de cette marque est
conservée et reste distincte des 29 pictogrammes fonctionnels blanc/argent. Les
quatre anciens actifs sont archivés dans
`../docs/archive/design/brand-marks-before-owner-art-2026-11-09.tar.gz`.
Pour les surfaces de recherche, les deux fichiers de `assets/brand/search/`
(`skkup-favicon.png` et `skkup-organization-logo.png`) sont des copies exactes
du mark original `assets/brand/marks/skkup-s-favicon.png` (1254 × 1254 px).
Le favicon HTML et le logo Organization des données JSON-LD utilisent donc le
fichier identique à Marks, recentré avec la même translation et sans
recoloration ni redessin. La route publique
`/assets/[...path]` autorise explicitement ces deux fichiers. Cette intégration
ne garantit pas le délai de recrawl ou l’affichage effectif par Google Search.
Le titre principal du dashboard Viewer utilise le mark
`assets/brand/marks/skkup-s-favicon.png`, rendu en niveaux neutres blanc/argent
par un filtre CSS limité à cette image; le fichier de marque partagé reste
inchangé. Le grand mark décoratif du hero Viewer et les marques Admin gardent
la palette fournie par le propriétaire. Les titres des pages secondaires
continuent d’utiliser le glyphe fonctionnel du registre correspondant à leur route.
Viewer : Récompenses `gift`, Historique des points `points`, Compte `users`,
Tirages `draws`, Règlement `rules` et Extension `extension`. Admin : Tirages
`draws`, Lots `gift`, Annonces `megaphone`, Signalements `flag`, Utilisateurs
`users` et Journal d’audit `audit`. Pages publiques : accueil
`streams`, streams `streams`, tirages `draws`, règlement `rules`, FAQ `sparkle`,
confidentialité `shield`, connexion et inscription `users`, extension
`extension`. Les illustrations marketing et métier restent dans leurs zones
visuelles dédiées; les titres affichent uniquement les pictogrammes du registre.
Le glyphe logique `draws`, utilisé dans la navigation Tirages, les blocs de
tirage de la vitrine et l’état vide d’activité Viewer, utilise
`assets/icons/ui/draws-v2.png` (PNG RGBA, 1254 × 1254 px, SHA-256
`64195caefcd5313c75042bee44b84837a9e56ca8d451cbeb01d72d71c3d80991`).
`next/image` optimise les PNG à la demande pour les tailles d'affichage des
composants; les sources haute résolution demeurent inchangées. Le runtime
standalone inclut Sharp pour le traitement local des images.
Pour le glyphe `points`, la pièce fournie par le propriétaire est rendue en
niveaux neutres blanc/argent; le S reste intégré à la pièce. Le fichier runtime
est `assets/icons/ui/points.png` (RGBA, 1254 × 1254 px). Les
tailles `sizes` des KPI admin, des navigations et de la topbar points suivent
leurs dimensions CSS responsives afin que l'optimiseur ne serve pas une source
trop petite.
La topbar du Viewer et de l’Admin commence à y=0 et reste sticky pendant le
défilement. Son contenu garde un inset vertical symétrique de 0,5 rem; le
conteneur principal n’ajoute pas de padding supérieur.

La vitrine d’accueil s’arrête sur trois sections (intro avec navigation, lots,
parcours « Comment ça marche » avec CTA/footer). Le bloc chiffres d’origine,
avec ses quatre messages et icônes, est placé après les cartes lots dans la
section « Ce que Skkup rend visible », sans arrêt de snap séparé. Le snap vertical
est limité à cette route et s’applique au scroll racine avec une transition
fluide. À la frontière d’une section, les gestes de molette (lignes, pages ou
pixels) avancent d’un seul arrêt avec une animation douce; l’inertie de la
rafale ne peut pas enchaîner les arrêts. Le verrou reste actif jusqu’à la fin
du scroll animé et de la rafale de wheel; ses 180 ms de silence se mesurent
depuis le dernier événement wheel et peuvent s’écouler pendant l’animation,
sans attente supplémentaire après `scrollend` lorsque la rafale est déjà finie.
Le tactile et le clavier gardent le défilement natif. Les zones verticales
imbriquées restent utilisables, et `prefers-reduced-motion` désactive le
traitement animé de la molette. Les sections ont une hauteur minimale de
100svh et peuvent grandir avec leur contenu pour rester entièrement parcourables
sur mobile. Au dernier arrêt, les impulsions résiduelles
de molette vers le bas sont bloquées à la limite de la section et ne font pas
défiler le document au-delà de la vitrine. Les grilles des trois lots et des quatre
étapes ont chacune 2 rem d’espace au-dessus et au-dessous, avant les statistiques
ou le CTA « Prêt à commencer ? ». Le CTA final garde le titre et le descriptif à
gauche; sur desktop, le bouton se place à leur droite, puis passe sous le texte
sur mobile. Le pied de page reste centré. La dernière section n’ajoute pas de
réserve verticale après le pied de page; à partir du breakpoint desktop, sa
hauteur libre est répartie avant le CTA, tandis que le premier bloc garde son
positionnement centré et le CTA reste accolé au pied de page en bas du dernier
arrêt.
Les pages publiques
secondaires ne sont pas affectées. La détection des zones imbriquées ignore les
ancêtres génériques `body` et `main`, afin que plusieurs gestes de molette
repartent depuis le même point du pointeur.

Chaque section d'accueil a un repère fléché positionné à son bord inférieur;
un espace réservé évite qu'il masque le contenu, le CTA ou le pied de page.
Le repère est masqué au vrai bord inférieur du document, et reste visible tant
qu'un défilement est possible. Sa visibilité se met à jour pendant le scroll,
au redimensionnement et lorsque la hauteur du contenu change. L'animation du
chevron est désactivée lorsque `prefers-reduced-motion` est activé; son nom
accessible est traduit en français et en anglais.

L’illustration hero de la vitrine utilise `assets/marketing/hero/skkup-hero-products.png`
(1536 × 1024 px). Son nom ne contient pas de numéro de version, et les métadonnées
Open Graph et Twitter utilisent les mêmes dimensions.
À partir du breakpoint desktop, le bas de l’illustration s’aligne sur celui des
boutons du hero au repos. Le PNG et l’échelle de l’image restent inchangés
(scale 1,04; orbit mobile .85). Une lueur radiale CSS pulse et s’estompe derrière
la boîte ouverte; l’image elle-même reste stable. Avec
`prefers-reduced-motion`, le pulse s’arrête et seule une lueur statique faible
reste visible.
Le hero est rendu directement, sans attendre l’observateur des animations au
défilement; son image prioritaire et ses textes ne restent donc pas masqués
pendant l’hydratation. Les animations au défilement restent actives pour les
sections suivantes. Ce réglage ne change pas le contenu ni le défilement des
sections de la vitrine.

Le cockpit Admin et le dashboard Viewer partagent leurs tokens de surface,
typographie (dont l’approche des titres), boutons et espacements dans
`design-tokens.css`. Les KPI Admin reprennent le cadre segmenté du Viewer,
avec des séparateurs adaptés aux grilles de quatre, deux ou une colonne. Les panneaux Admin conservent leurs
séparateurs pleine largeur tout en alignant le contenu sur l’inset partagé de
1 rem. Le `line-height` des titres et boutons est également défini par des
tokens communs. Les mesures navigateur après rebuild restent nécessaires pour
confirmer le rendu final et le responsive.

Les blocs Viewer n'utilisent plus d'illustration PNG dédiée aux récompenses;
la précédente a été retirée le 2026-11-03. La série actuelle utilise le
pictogramme fonctionnel `flame`; l'ancienne illustration de série a été retirée.
L’état vide Cartes à gratter de l’accueil Viewer utilise le glyphe
`scratchCard` blanc/argent. La page Récompenses utilise aussi ce glyphe dans
l’en-tête de la collection Cartes à gratter. Le KPI Admin « Lots disponibles »
utilise le pictogramme `gift` blanc/argent; les illustrations grand format
restent réservées aux contenus qui peuvent les afficher lisiblement.
La grille propriétaire reste la référence de forme; la recoloration neutre du
pack courant préserve ses silhouettes sans ajouter de calque du S. Voir
[`dashboard-icon-usage.md`](../docs/design/dashboard-icon-usage.md) et les
résultats de vérification liés. Le thème CSS des pages est distinct des pixels
des icônes.
Le titre du dashboard Viewer principal reprend l’icône fonctionnelle `analytics`,
comme l’entrée Dashboard de sa navigation. Le mark Skkup reste dans le bandeau
comme illustration décorative à droite.

La palette néon Skkup et les composants réutilisables (`CarteGlow`,
`BoutonCTA`, `BandeauStats`, `BarreProgressionStreak`) vivent dans
`src/components/ui/`; les tokens canoniques sont définis dans
`src/app/design-tokens.css` et consommés par les règles du dashboard dans
`src/app/globals.css`.
Les surfaces bleues profondes et les accents violet/cyan gardent l'identité
néon dans un équilibre sobre et lisible.
Les espaces Viewer et Administration utilisent le même cadre React
`src/components/dashboard/DashboardFrame.tsx`. Le dashboard Viewer principal,
et non la vitrine publique, est la référence des surfaces, couleurs, bordures,
rayons, ombres, typographie et boutons. La couche
`.skuup-premium-dashboard-shell.skuup-dashboard-shared-frame`
dans `src/app/globals.css` expose les tokens communs et les applique aux pages
Viewer et Admin; chaque espace conserve sa structure, sa navigation, ses
permissions et ses commandes métier. Les variantes de mise en page et les
couleurs d'état sémantiques restent locales aux composants. Les blocs KPI,
panneaux, en-têtes, boutons, espacements, icônes KPI et hiérarchie typographique
consomment les mêmes tokens; l'Admin conserve uniquement les grilles métier
(dont ses quatre KPI), la disposition des tableaux et la densité nécessaire à
ses données opérationnelles. Le titre principal et les boutons outline
partagent aussi leurs hauteurs de ligne via les tokens de `design-tokens.css`.
Les quatre KPI Admin utilisent le même cadre arrondi et la même surface continue
que les segments Viewer, avec des séparateurs et une grille responsive 4/2/1.
Les panneaux Admin gardent leurs séparateurs pleine largeur; l’en-tête, les
lignes de données et les listes portent un retrait de contenu commun de 16 px
au lieu d’un padding sur le panneau racine.
Les titres de page utilisent le pictogramme fonctionnel associé à leur
destination dans le registre `SkkupIcon`; les illustrations restent réservées
aux emplacements de contenu dédiés. Les routes secondaires Admin réutilisent
`AdminPageHeader` et les tokens du header Viewer au lieu de conserver des
traitements de titre propres à chaque composant. Sur les six routes secondaires,
`AdminPageHeader` reprend le header Viewer: kicker magenta, H1 en
`.skuup-dashboard-page-title`, pictogramme fonctionnel inline de 38 px,
description dessous et séparateur inférieur. Les actions restent dans leur
aside à droite, puis s’empilent sous le texte sur petit écran. Le label sr-only qui nomme le `main` conserve
son identifiant mais n’ajoute pas un second H1 sur ces routes; l’en-tête visible
du cockpit reste inchangé. Les liens des sidebars Viewer et Admin partagent
également une taille de libellé augmentée de `.04rem` et des pictogrammes de
navigation augmentés de `.1rem`, sans modifier les gabarits ni les liens. Les
KPI des pages opérationnelles centrent icône, libellé et valeur
dans leur carte avec une règle CSS partagée. Les longues listes d’annonces,
d’audit, de modération, de lots, d’utilisateurs et de tirages utilisent
`.skuup-admin-scroll-area` pour garder une hauteur bornée et un défilement
interne; le tableau des lots garde ce conteneur borné et défilant lorsque ses
lignes passent en cartes sur petit écran.
Sur la page principale Admin, les seules icônes du contenu sont celles des
quatre KPI; les titres, états vides et actions du corps restent textuels. Les
liens de navigation Admin utilisent les mêmes pictogrammes PNG du registre que
Viewer, alignés sur les tokens communs; le titre générique « Menu » est omis.
Les libellés des liens gardent leur focus clavier et leur état actif.
Les panneaux du cockpit Admin affichent chacun un seul titre principal; les
libellés de catégorie redondants ont été supprimés du balisage.
Les deux rails utilisent le même lien de marque, le même composant wordmark,
les mêmes dimensions d’image et la même structure sans libellé masqué, afin
que le premier lien de navigation suive le même repère vertical. Le brand et
le groupe de liens gardent leur hauteur intrinsèque dans la colonne; un menu
plus long fait défiler le rail au lieu de comprimer ces blocs.
Les valeurs de synthèse de Tirages sont centrées dans leurs tuiles. Les badges
des tickets récents partagent une largeur bornée et un centrage commun pour
rester lisibles dans les lignes étroites. Les cartes à gratter, filtres,
panneaux et états vides de Récompenses ainsi que la carte de Règlement du
Dashboard consomment directement les tokens de surface du dashboard. La carte publique de règlement conserve son style public.
Dans les navigations Viewer et Admin, l’état actif partage le même fond discret
que le survol et un repère intérieur violet, sans halo externe.
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
Chaque page conserve un seul titre principal dans son introduction. Les titres
de l’introduction et du formulaire n’affichent pas d’icône de compte. Le bloc
introduction + formulaire est centré dans l’espace disponible sous l’en-tête,
horizontalement et verticalement quand le contenu tient dans le viewport; si le
formulaire est plus haut, la page s’étend et reste défilable. Tous les textes de
l’introduction et les champs du formulaire restent alignés à gauche. Les
illustrations points et ticket des bénéfices restent visibles.

La session n'est pas stockée par le frontend. `POST /auth/login` et
`POST /auth/register` ne renvoient que `{ pseudo }` et posent le jeton dans un
cookie `httpOnly`, inaccessible au JavaScript de la page. Les requêtes
authentifiées utilisent `credentials: "include"` par l'intermédiaire de
`fetchAuthentifie()`. La déconnexion passe par `POST /auth/logout`. Si une page protégée reçoit une réponse `401`, elle redirige automatiquement vers la vitrine `/`; la page `/connexion` reste accessible explicitement pour ouvrir une session.
L’inscription affiche d’abord le règlement dans un modal accessible et bloque
l’accès aux champs tant que l’utilisateur n’a pas coché l’acceptation puis
confirmé l’action. Le formulaire révèle ensuite les champs et transmet
`accepteReglement: true`; l’API refuse toute création sans cette acceptation.
Dans le modal, seul le contenu du règlement défile: son viewport interne utilise
la scrollbar violette commune aux listes Viewer, tandis que l’en-tête et les
commandes d’acceptation restent fixes.
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
`e2e/dashboard-v3-cockpit-breakpoints.spec.ts` : elle charge les tokens partagés et les deux feuilles CSS, puis
contrôle les colonnes du cockpit à 1280, 768, 767 et 320 px, ainsi qu'une
grille d'écran secondaire et la taille d'icône KPI depuis le token commun. Le garde-fou partagé de `globals.css` exclut
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

Le header principal Admin passe en colonne au même breakpoint de 700 px que
celui du Viewer.

Les panneaux de données du viewer et du cockpit `/admin` gardent une hauteur
de contenu responsive indépendante du nombre de lignes: listes viewer de 8 à
12 rem (historique jusqu'à 15.75 rem, grille des cartes à gratter de 11 à 17
rem), et tables/listes cockpit de 11 à 18 rem. Les listes viewer de lots,
tickets, historique et cartes à gratter, ainsi que les tables, signalements et
activités du cockpit, défilent à l'intérieur avec une barre violette; les
en-têtes et actions de panneau restent hors du défilement, et les en-têtes de
table restent fixes. La zone Cartes à gratter garde toujours sa liste `<ul>` de
17 rem avec un contour pointillé; l'état vide est centré à l'intérieur sans
contour ni fond imbriqué. Jusqu'à trois cartes sont dimensionnées pour la zone;
le track est centré si les cartes tiennent et s'aligne au début lorsqu'il
déborde. Sur les écrans étroits, elles défilent horizontalement avec la barre
violette sans dépasser son cadre. Dans ce panneau, la colonne de titre peut rétrécir et
le sous-titre long revient à la ligne dans la largeur disponible, y compris
sur écran étroit.
Les zones scrollables ont un nom accessible et peuvent recevoir le focus pour
le défilement clavier. La table de lots admin garde une grille à quatre
colonnes, avec défilement interne sur les largeurs où son contenu ne tient pas.
Ces règles sont limitées aux deux dashboards principaux; les routes secondaires
ne changent pas.

Le cockpit administrateur `/admin` utilise exclusivement le résumé API
`/admin/dashboard/summary`. Sa grille V3 présente les indicateurs, tirages,
lots, annonces, signalements et activités avec des états neutres lorsque le
contrat ne fournit pas de type, d'image ou d'identité. Les descriptions réelles
des tirages ouverts sont rendues sous leur titre. Aucun contenu de démonstration
n'est injecté côté interface. Le panneau Annonces affiche jusqu’à deux
annonces réelles renvoyées par le résumé, sans inclure la gestion éditoriale.
Le panneau Signalements est placé dans la surface d’aperçu, avant les KPI, afin
que les alertes et leur action de traitement soient visibles dès l’arrivée sur
le cockpit. Il conserve les trois premiers signalements du résumé, le total
réel et les destinations de modération existantes; l’état vide compact garde
son icône, son texte et son action dans le cadre pointillé. Quand il est vide,
son conteneur ne conserve pas la hauteur fixe réservée aux listes scrollables.
Sur écran étroit, l’action passe sous le texte. Le tableau Tirages
conserve une grille minimale de 37 rem à partir de 701 px et défile dans son
propre panneau; son focus clavier reste visible. La grille mobile prévaut sous
ce seuil.

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
Le dashboard principal n’affiche que trois cartes à gratter au maximum; le lien
« Voir toutes les cartes » ouvre `/dashboard/recompenses` lorsqu’il y en a plus.
La page Récompenses conserve toutes les cartes disponibles renvoyées par le
contrat, sans compteur total redondant dans son en-tête. Le contrat actuel
`GET /me/scratch-cards` ne renvoie que les cartes non grattées; après rechargement,
le filtre « Utilisées » ne peut donc pas restaurer les cartes grattées dans une
session précédente. Une carte grattée reste visible dans ce filtre pendant la
session en cours.
La page `/dashboard/recompenses` sépare la collection, le résumé du compte et
les panneaux d'activité en rangées responsive. La collection, les tickets et
le guide conservent leurs zones défilantes internes. Le bloc « Récompense
sélectionnée » s'adapte à la hauteur réelle de son visuel, de ses informations,
de sa progression et de son action; son contenu n'est pas tronqué par un scroll
interne. La page défile si nécessaire pour afficher le bloc complet. La colonne
de résumé conserve le solde et la récompense sélectionnée. Cette colonne
n’affiche pas de panneau de prochain tirage afin de réserver cet espace au détail
de la récompense. Le bloc « Ton solde » resserre l’espacement entre son libellé, le
montant en points et le total de tickets. Les cartes à gratter disponibles
n’affichent pas de badge « Disponible » sur chaque carte; la disponibilité reste
exprimée par l’onglet filtre; les cartes utilisées indiquent leur état dans leur
titre, sans chip de statut, bouton d’action de grattage ni badge répété en bas.
Une carte disponible sélectionnée n’affiche pas de mention sur le
contrat du compte; une carte déjà grattée garde son message d’état. Sur petit
écran, les panneaux se réorganisent en une colonne.
Le bandeau de recherche et de tri n’est pas affiché sur cette page. Les onglets
Toutes, Disponibles et Utilisées restent disponibles pour filtrer les cartes;
la collection conserve l’ordre des plus récentes aux plus anciennes.
La grille Récompenses et ses breakpoints sont regroupés dans une seule section
CSS dédiée; les règles générales Streams ne modifient plus ses colonnes. Sur
grand écran, la collection garde un minimum responsive de 30 à 40 rem et
s'étire avec la hauteur naturelle de la colonne de résumé pour aligner leurs
bords bas. Aux écrans de moins de 900 px, les panneaux s'empilent et la
collection reprend sa hauteur responsive. La collection
garde un minimum de 22 rem sous 900 px et 20 rem sous 600 px. Les panneaux
Tickets et Guide passent de 17 à 15 rem sous 900 px. Les cartes passent de
trois colonnes à deux sous 600 px, puis à une colonne sous 560 px. Chaque
panneau de collection, Tickets et Guide conserve son défilement interne violet;
le détail sélectionné reste entièrement visible et le défilement général de la
page reste disponible.
Le panneau « Activité réelle / Derniers tickets » place en premier le ticket le
plus récent renvoyé (trié par `createdAt` côté API), son nom de tirage
et sa date/heure contractuelle. Son badge distingue un tirage ouvert, clôturé
avec résultat en attente, ou effectué avec/sans gain. Le nom du lot est affiché
uniquement lorsque l’API confirme le gagnant et fournit ce lot; aucun résultat
n’est déduit localement. Les tickets précédents et l’état vide restent affichés
selon la réponse de `GET /me/raffle-tickets`. Les badges occupent une largeur
commune plafonnée à 7 rem et à 48 % de la ligne, avec le texte centré et autorisé
à revenir à la ligne sur mobile.
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
L’activité récente consomme `transactionsRecentes` de
`GET /me/dashboard/summary`, qui comprend les mouvements de points et les
sessions de visionnage sans mouvement ledger. Chaque session reste une ligne
`WATCH_TIME` et affiche sa plateforme et sa durée; à zéro point, la valeur est
`0 point` avec l’icône S-coin, alignés au bord droit dans un groupe accessible.
Le bloc n’affiche que les éléments des sept derniers jours, dans une fenêtre
glissante de 168 heures; un élément reste visible à la frontière exacte et
disparaît dès qu’il la dépasse. `GET /me/dashboard/summary` applique ce même
filtre et renvoie toutes les activités de la fenêtre sans plafond fixe. Un
minuteur local retire les éléments expirés même si le dashboard reste ouvert;
les délais longs sont bornés à la limite du navigateur puis recalculés au
réveil. Cette projection ne modifie pas le registre comptable : les anciennes
opérations restent conservées, mais le registre complet n’est pas accessible
dans l’interface viewer.
Le flux n’invente aucun mouvement à zéro dans l’historique comptable paginé.
Les blocs du dashboard ne proposent pas de liens rapides de consultation dans
leurs en-têtes ou leurs états vides. La navigation reste portée par le menu
latéral, tandis que les boutons métier nécessaires restent visibles dans leur
contenu.
La carte « Extension à associer » n’est pas affichée sur cette page principale.
L’association et la gestion de l’extension restent disponibles depuis
`/dashboard/extension`, le compte et les parcours concernés.
Les montants de l’activité récente sont alignés au bord droit de chaque ligne;
le PNG officiel du S-coin et la valeur restent groupés, avec la valeur en fin
de ligne. Une activité de visionnage sans points affiche « 0 point » et l’icône
S-coin avec un libellé accessible qui précise qu’aucun point n’a été crédité.
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
parcours `/dashboard`, `/dashboard/tirages` et
`/dashboard/reglement`, ainsi que le menu compte dans l'espace privé. Le
catalogue de streams n'est plus une page Viewer; l'ancienne route
`/dashboard/streams` redirige vers `/dashboard`. Le catalogue public `/streams`
reste accessible.

La navigation latérale DASH-V3 conserve une emprise commune de `2.8rem` pour
les pictogrammes viewer et admin, flex-basis inclus. Cette règle empêche les
sélecteurs responsive spécifiques de comprimer les icônes et maintient le
rendu sans cadre attendu par les références.

La barre supérieure part du bord haut du viewport dans les espaces Viewer et
Admin, y compris au retour en haut après défilement. Le shell partagé et la
barre elle-même n'ajoutent pas de retrait supérieur. Les pages Viewer
secondaires `/dashboard/tirages`, `/dashboard/recompenses`, `/dashboard/reglement`,
`/dashboard/extension` et `/dashboard/compte` utilisent maintenant un rythme
vertical resserré entre l'en-tête et leur contenu, avec une marge réduite sous
la barre haute. Le padding supérieur du contenu reste nul; les règles
d'espacement Admin ne changent pas. La réduction de marge sous la barre haute
s'applique aussi à la page d'accueil `/dashboard`.
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

Dans le détail d’un tirage public ou Viewer, les deux blocs Ouverture et Tirage
centrent leur libellé et leur date; cette règle ne s’applique pas aux autres
métadonnées.

Dans le dashboard `/dashboard/tirages`, la liste aligne maintenant chaque
carte en haut sans pictogramme ni vignette, avec le statut et la date en tête,
puis le titre, les noms des lots mis en évidence, un aperçu de description
limité à deux lignes et enfin les compteurs de lots et de tickets distribués
renvoyés par l'API. Aucun nombre ou état de ticket n'est déduit. Le détail place
l'icône de tirage `draws` du registre Skkup (`draws-v2.png`) en haut à droite,
en position absolue pour ne pas déplacer le texte. L'image réelle du premier lot
reste dans le détail lorsqu'elle est fournie; elle n'est pas remplacée par
cette icône. Sans image, le dashboard n'affiche aucun cadre d'art vide; le
catalogue public `/tirages` conserve son fallback ticket.
Les cartes ont une hauteur naturelle liée à leur contenu; leur padding et les
espacements internes sont compacts pour éviter tout débordement du texte.
La carte sélectionnée garde un contour et un repère latéral visibles en plus
de l'état `aria-pressed`. La liste et le détail restent empilés lorsque la
largeur de contenu de la page est inférieure à 900 px; au-dessus, le détail
reprend la seconde colonne. Dans le détail, image/fallback et nom du lot gardent
des dimensions stables; fournisseur et valeur sont omis lorsqu'ils sont
absents, et affichés sous le nom sous 400 px de largeur de contenu.

Cette mise en page ne modifie ni l'inscription, les réponses d'erreur, les
résultats publiés, ni les règles d'acquisition ou d'utilisation des tickets.
Elle requiert les mêmes données `GET /raffles` et `GET /raffles/:id/result` que
la version précédente; aucune API ou configuration supplémentaire n'est
nécessaire. Le catalogue public `/tirages` garde sa composition existante. Les
seuils de composition portent sur la largeur du conteneur Tirages, pas
directement sur celle du viewport.
En composition deux colonnes, le détail reste dans la grille et fixe sa hauteur
naturelle. La liste est superposée dans la première colonne, dont l'espace est
réservé par un pseudo-élément; sa largeur reprend la proportion de cette
colonne et son défilement vertical reste interne, même si elle contient plus
de cartes que le détail. En composition empilée, le positionnement absolu et le
scroll interne ne s'appliquent pas: la liste reprend sa hauteur naturelle et
défile avec la page.
Le document désactive le rebond vertical aux extrémités sur toutes les routes,
sans remplacer leur défilement normal. Le dashboard Tirages utilise en plus un
scrollport de hauteur viewport réservé à cette route: le document ne défile pas.
Sur mobile, la navigation reste accessible dans une zone défilable limitée à
40 % de la hauteur visible; le panneau principal défile dans la hauteur restante.
Les autres pages dashboard et le catalogue public `/tirages` gardent leur
défilement naturel, sans saut au haut ou au bas de page.

Le parcours d'extension présenté dans le dashboard est limité à Chrome en V1.

La page `/dashboard/extension` regroupe désormais l'installation, les étapes
d'appariement, le code de liaison, les plateformes compatibles et les règles de
confidentialité dans un bloc principal, sans en-tête redondant ni icône décorative
au-dessus des étapes. Le titre « Appareils associés » est sans icône; le pictogramme
de chaque appareil reste visible dans sa ligne. L'état d'appariement reste rendu par
`CodeAppariement` afin de conserver ses états indépendants, ses erreurs et son
rafraîchissement temps réel. Un compte ne peut avoir qu'un seul appareil actif
à la fois; le message de limite est centré. Le smoke test responsive couvre les variantes
françaises et anglaises sur 390 px et 1280 px.
Les plateformes de validation affichées sont Twitch, YouTube et Kick.
Dans les trois cartes de plateformes compatibles, chaque icône et son libellé
forment un groupe horizontal centré dans la carte.

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
les pictogrammes conservent une emprise de 2,8 rem sans cadre décoratif. À ces
largeurs, les libellés composés peuvent revenir à la ligne aux espaces; les
libellés d'un seul mot portent la classe
`skuup-dashboard-nav-label-single-word`, qui les maintient sur une ligne sans
coupure interne ni césure automatique. Les dimensions des pictogrammes, de leur
boîte et les espacements restent inchangés.
Le cockpit admin principal conserve maintenant une hiérarchie dédiée pour son
hero, ses KPI et ses panneaux d’activité. Quand un contrat renvoie zéro élément,
les panneaux affichent un état vide structuré et un lien vers l’action réelle
correspondante, sans fabriquer de contenu ou de compteur.
Le titre du cockpit réutilise les mêmes classes Viewer pour le kicker, le titre,
la description et le repère visuel, afin de conserver leur hiérarchie et leurs
espacements communs tout en gardant le libellé et l'icône Analytics Admin.
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

La surface viewer expose les routes `/dashboard/recompenses`,
`/dashboard/compte` et `/dashboard/extension`. L’écran Historique viewer et
ses liens de navigation ont été retirés; `/dashboard/historique` redirige vers
`/dashboard#history`. Le dashboard principal conserve l’activité récente et
affiche les opérations retournées par l’API jusqu’à sept jours d’ancienneté.
L’ancien parcours paginé complet n’est
plus disponible dans l’interface viewer. Son API et ses données restent
conservées, de même que les historiques d’administration. Les récompenses
regroupent les cartes, tickets et tirages à partir des réponses API existantes;
le compte affiche le profil et la sécurité; l'extension génère le code
temporaire d'appariement. Ces écrans séparent les états de chargement, vide et
erreur et n'inventent aucune donnée métier.

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
sert directement ces images depuis `frontend/assets/`.

## Administration des annonces et de l’audit

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
Dans ce menu, la langue se choisit avec un contrôle segmenté FR/EN, sans
libellés répétés. Le bouton actif est l’unique arrêt de tabulation du groupe;
les flèches changent la langue et déplacent le focus. Échap et un clic extérieur
ferment toujours le menu, et le focus reste visible au clavier. Le contrôle est
aligné à gauche dans le menu du compte.
La liste des appareils associés se met à jour automatiquement via Socket.IO
après une association ou une révocation. Le panneau affiche uniquement
l’appareil courant actif; les appareils expirés ou révoqués ne sont pas exposés
comme historique dans l’interface. Le groupe icône/libellés est centré dans la
carte. Le bouton « Actualiser l’état » est centré sous la liste dans tous les
états et reste disponible si la connexion temps réel est absente.
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
n'est encore disponible. L'article Organisateur a été retiré et les articles
suivants sont renumérotés dans les versions française, anglaise et administrée.
À l'article 3, le règlement affiche dans les deux
langues la règle V1.0 : seuls les visionnages actifs reconnus sur Twitch,
YouTube Gaming ou Kick via l'extension officielle Skkup dans Chrome de bureau
génèrent des points. Applications natives, appareils mobiles, tablettes,
téléviseurs connectés, navigateurs sans extension et autres plateformes sont
exclus; Firefox et Opera sont prévus en V1.1. Cette règle est injectée aussi
dans le contenu public géré par l'admin. Les tests du rendu public vérifient le
texte et sa position après l'article 3 en contenu géré comme en fallback; le
test E2E dashboard vérifie les formulations localisées. Le règlement conserve
son statut de projet à vérifier juridiquement, sans validation juridique déclarée.
Le règlement public affiche le contenu sans bandeau éditorial de relecture
juridique au-dessus des articles.
La page Règlement du dashboard affiche le contenu publié avec le même fallback
historique et ne présente pas de bandeau distinct de date ou de statut.
Dans le dashboard Viewer, le premier titre du bloc est rapproché du bord
supérieur: le padding haut est fixé à `1.25rem` et la marge/décoration du
premier titre est supprimée. Les séparateurs et espacements des titres suivants
restent inchangés; le règlement public conserve son padding responsive.

La vitrine et le règlement proposent un lien de pied de page vers la FAQ; les
libellés respectent la langue sélectionnée et restent accessibles au clavier.

Un audit UX indépendant des dashboards viewer et administrateur est suivi dans
`docs/audits/90-audit-dashboards-ux.md`. Les rendus navigateur, les états vides,
les états d'erreur et les différences avant/après doivent être vérifiés avant
la livraison finale.

La refonte UX-003 poursuit cet audit avec une architecture cible et un
prototype fonctionnel dans `docs/design/ux-003-target-architecture.md` et
`docs/design/ux-003-prototype.html`. Chaque lien ou action ajouté doit avoir un
comportement réel et être testé en succès, état vide et erreur.

Les routes administrateur `/admin/raffles`, `/admin/lots`,
`/admin/announcements`, `/admin/users` et `/admin/audit` constituent des écrans
autonomes. La gestion éditoriale `/admin/content` a été retirée du frontend,
de sa navigation et du cockpit. Les annonces gardent leur page de gestion
dédiée `/admin/announcements`. Les contenus publics et leurs lecteurs localisés
restent servis par les routes `/content/...`; les données existantes ne sont
pas supprimées. La modération reste accessible sur `/admin/moderation` avec
sélection d'un dossier, preuves, chronologie et qualification.

L'écran `/admin/users` complète cette composition avec quatre indicateurs, des
filtres par recherche, rôle et statut, puis une sélection master/detail. La fiche
sélectionnée expose uniquement les champs et compteurs renvoyés par l'API et
permet l'activation ou la désactivation via le contrat administrateur. Aucun
profil ou compteur de démonstration n'est injecté côté frontend.

La route privée `/dashboard/streams` redirige vers `/dashboard`. Le catalogue
de streams public et son contrat `GET /streams` restent disponibles hors du
dashboard; lorsqu'une entrée fournit `thumbnailUrl`, sa carte affiche cette
miniature HTTPS, sinon elle conserve l'icône de catalogue. Le frontend ne
génère ni ne présente jamais une image fictive comme miniature de stream.

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
depuis `assets/icons/ui/`. Les fichiers source sont carrés, transparents et en
haute résolution; `next/image` les adapte à la taille d’affichage sans modifier
les originaux. `points`, `ticket` et `ticketIllustration` rendent chacun une
seule image PNG. Le fichier points conserve l'emblème intégré dans la source
propriétaire; `SkkupIcon` n'ajoute aucune image S en surimpression. Les logos
de plateforme, le fichier de marque S séparé et les illustrations métier restent
des sources distinctes. Le pictogramme `cube`
non rendu a été supprimé; le KPI admin Lots utilise maintenant `gift`.
Le nom logique `draws` pointe vers l'unique source runtime PNG
`draws-v2.png`; l'image précédente a été retirée du projet et de la route
publique après vérification des usages runtime.
Dans `BandeauStats`, les PNG KPI `points`, `flame` et `ticket` déclarent une
taille source de 48 × 48 px et partagent la classe d’image sans cadre; les
autres icônes du bandeau gardent leur taille de 22 px.

Les anciens alias overview, devices, dailyVisit, content, moderation, singleUse
et spark sont rabattus sur le glyphe voisin qui décrit la même action. Le bouton
« Comment ça marche » réutilise `streams`, qui représente déjà un lecteur avec
son triangle Play argenté. Le PNG fonctionnel `flame` est utilisé pour le KPI
« Série actuelle » du viewer et les notifications de série. Les pastilles
d’état dynamiques restent pilotées par les données et le CSS.
Les anciens PNG métier `daily-visit` (sans emplacement dédié) et
`scratch-card` (copie exacte du ticket S, sans usage runtime) ont été supprimés;
le pictogramme compact `scratchCard` de `assets/icons/ui` reste utilisé.

Les logos Twitch et YouTube sont rasterisés fidèlement depuis leurs sources de
marque officielles en PNG transparents 128 × 128 pour les vues runtime. La page
Extension utilise le logomark blanc Kick fourni dans le [KICK Brand Toolkit](https://about.kick.com/brand),
sur son fond bleu nuit. Les sources SVG Twitch et YouTube restent dans
`assets/platforms`; le SVG Facebook obsolète a été retiré le 2026-11-03.
La pièce points reprend l'image fournie par le propriétaire recolorée en
niveaux neutres blanc/argent, dans `assets/icons/ui/points.png`.
Les 29 URLs du registre `SkkupIcon` portent chacune les huit premiers
caractères du SHA-256 du PNG actif dans leur fragment (`#v=<sha256-prefix>`).
Next Image utilise cette URL comme clé de cache; recalculer le fragment correspondant
à chaque PNG lorsqu’il est remplacé. L’alias `ticketIllustration` utilise aussi
le fragment SHA du même `ticket.png`; l’illustration distincte d’extension est séparée. Mettre à jour ce fragment lorsque le fichier change.
Son emblème S reste intégré; le composant rend cette seule image, sans ajouter
de calque. Les visuels de vitrine continuent d’utiliser leurs images
dédiées et leurs textes alternatifs.

Les images source du site sont toutes centralisées dans `frontend/assets/`.
La route Next `/assets/*` les sert directement; aucun dossier
`public/` n'est utilisé pour les médias. La carte des dossiers est dans
[`assets/README.md`](assets/README.md).

Le dashboard viewer V3 ne présente pas de panneau d’annonces dans son contenu.
Les annonces publiées sont consultées depuis le menu Notifications par
`GET /viewer/announcements`, avec pagination `{ items, nextCursor }` et
« Charger plus ». Ce contrat requiert une session authentifiée, inclut les
annonces publiées même si leur fenêtre de diffusion est future ou expirée et
exclut les annonces archivées/non publiées. Une sélection ouvre un modal
accessible affichant le titre et le texte brut. Le modal a un en-tête distinct
avec kicker, titre et bouton de fermeture, une zone de texte défilante quand
l’annonce est longue et un bouton Fermer dans le pied. Les dimensions et la
surface suivent les tokens partagés; le contenu reste lisible sur petit écran.
Le comportement de lecture, du badge et des toasts est décrit dans la section
Notifications du dashboard. La modale est rendue dans `document.body` pour
rester centrée sur la fenêtre, hors des effets de composition de la topbar.
L’ouverture place le focus dans la boîte; Échap ferme et restitue le focus au
déclencheur. Cliquer sur le backdrop ne ferme pas le modal et conserve le focus
dans le dialogue; Tab et Shift+Tab restent confinés à ses contrôles.
Le badge accessible de la cloche reflète le nombre exact d'annonces non lues
parmi toutes les annonces publiées, y compris celles hors de la page chargée;
seul son dessin est plafonné à `9+`. Les IDs lus restent dans `localStorage`
sous une clé propre au profil (`skkup-dashboard-read-announcements-v1:<profileId>`)
et sont envoyés par lots à `POST /viewer/announcements/unread-count`. Le serveur
ne conserve pas leur état et les vérifie contre une photographie stable des
annonces publiées. Les ouvertures du menu ne marquent pas les annonces comme
lues; l’ouverture d’une annonce le fait localement. L’état ne se synchronise
pas entre navigateurs ou appareils. Les anciennes clés locales des notifications
temps réel ne sont ni lues ni supprimées. Les notifications de points, de série, de
carte et d'extension n'alimentent plus le menu ni le badge. Les confirmations
d'action Viewer, dont le pointage quotidien, l'ouverture d'une carte ou
l'inscription à un tirage, restent des toasts accessibles temporaires sans
créer de nouvelle annonce. L'événement temps réel `points:updated` produit
également un toast Viewer localisé quand son type est `WATCH_TIME`, avec le
montant de points de la session validée; les autres types de cet événement ne
créent pas de toast, afin d'éviter les doublons avec les confirmations d'action.
À l’ouverture du panneau, le focus passe au premier contrôle disponible, ou au
panneau lui-même si son contenu est vide/en chargement; Échap le rend à la
cloche et un clic extérieur ferme le panneau.
La gestion et l’historique des annonces restent dans l’espace admin.

Les tests unitaires ciblés couvrent le chargement, le comptage de toutes les
publications, le stockage local du statut de lecture, la navigation clavier,
le maintien du focus après interaction avec le backdrop, le contenu texte brut
et la taille minimale du bouton de fermeture. Ils valident
la logique du composant dans Vitest/jsdom, pas le focus ou le rendu calculé dans
un navigateur. Le contrôle CSS lit la feuille depuis la racine du package afin
de rester compatible avec le résolveur de modules de Vitest.

L'état vide de la collection Récompenses conserve une surface visuelle dédiée,
centre son icône et son message dans l'espace disponible sans augmenter la
hauteur du panneau ni créer de défilement artificiel. Les listes longues
gardent leur scroll interne violet; aucune carte ou récompense n'est créée si
elle n'est pas renvoyée par le backend.

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

À l’ouverture du menu du compte, le focus arrive sur le premier contrôle
actionnable. Échap referme le menu et rend le focus au bouton pseudo; Tab et
Maj+Tab restent dans ses contrôles.

Le hero du dashboard utilisateur utilise le logo S transparent sans cadre ni
pièce décorative. Le logo n'est plus répété dans la barre supérieure, où le
menu du compte reste le point d'accès à l'identité et aux actions du profil.

Les images de la section « Comment ça marche » de la vitrine n'affichent plus
de badge superposé indiquant une génération par IA. Les photos gardent la même
scène, avec le t-shirt noir dans les scènes install, watch et reward, l'avant-
bras nu dans l'étape points et le coffret fermé dans reward. Le texte alternatif
de reward décrit désormais le coffret visible sans inventer son contenu.

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

Les navigations latérales Viewer et Admin partagent la même colonne desktop et
répartissent leurs liens sur la hauteur disponible sans scrollbar interne. Les
hauteurs des liens et leurs espacements se réduisent fluidement sous 680 px;
à 400 px de hauteur ou moins, la navigation repasse dans le flux normal et le
défilement de page permet d’atteindre tous les liens; la hauteur maximale et
l’overflow interne hérités sont réinitialisés à ce breakpoint. À 900 px et moins,
les liens se replient en grille mobile et restent accessibles par le défilement
normal de la page.

Sur `/dashboard/reglement`, l’en-tête et le bloc de lecture partagent une largeur
maximale de 66 rem et sont centrés dans la zone principale. Le texte du
règlement reste aligné à gauche pour en faciliter la lecture.

Le comportement du menu Notifications, du badge, du statut de lecture et des
toasts de confirmation Viewer est décrit dans la section Notifications ci-dessus.

La page privée `/dashboard/streams` redirige vers `/dashboard`; la page Streams publique n’est pas modifiée. L’accueil Viewer ne transmet que trois cartes non grattées au maximum à son carrousel, et conserve le lien vers la collection complète dans Récompenses.

Le dashboard viewer regroupe désormais le hero de progression et ses trois indicateurs dans un même conteneur visuel. Les indicateurs restent séparés par des panneaux internes et s'empilent automatiquement sur les petits écrans.

Les retours de succès et les résultats informatifs Viewer utilisés par
l’événement local de notification apparaissent sous la rangée du header,
alignés au bord droit du menu de compte. Le toast s’annonce avec `aria-live`,
disparaît automatiquement et ne modifie pas la hauteur du hero ou des cartes
du dashboard. Ces confirmations d’action restent séparées des annonces et du
badge de la cloche.

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

Le Viewer et l’administration utilisent le même cadre de navigation: dimensions
et position de la barre, logo, espacements, hauteur et typo des liens, icônes,
fond, bordure et état actif. Les liens et libellés restent propres au rôle. À
900 px, les deux menus passent à une grille de deux colonnes; sous 600 px, ils
passent à une colonne. Les cartes KPI, panels, en-têtes de section, tables,
états vides et boutons Admin consomment les mêmes tokens Viewer de couleur,
surface, bordure, rayon, ombre, typographie et padding. Les grilles métier et
les couleurs d'état sémantiques gardent leur logique Admin. Les valeurs
communes sont centralisées dans `src/app/design-tokens.css` et appliquées dans
`src/app/globals.css`; les feuilles locales conservent la composition des
données, sans redéfinir le thème commun.

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
`GET /viewer/announcements`; cette route exige un JWT de session authentifié,
et non un rôle Viewer seul, et ne renvoie que les annonces publiées. Les dates
futures ou passées ne masquent pas une annonce publiée. Cela est distinct du flux public historique
`GET /announcements/active`.

Le Viewer réactualise cette liste lorsqu’il reçoit `raffle:status`, puis le
badge reflète les nouvelles annonces non lues du profil. Ce rafraîchissement
n’affiche aucun toast; les annonces restent consultables depuis la cloche. Sur
le Dashboard, `TableauDeBord` relaie le signal vers la Topbar via un événement
local et reste propriétaire de l’unique connexion Socket.IO. Sur les autres
pages Viewer, la Topbar conserve sa connexion temps réel. Les événements ne
remplacent pas le chargement REST au démarrage ou à l’ouverture du menu.

Les tests ciblés se lancent depuis `frontend/` avec
`npm test -- src/components/admin/AnnouncementsAdminV3.test.tsx`; ils couvrent
les actions via clients API simulés et ne prouvent pas la persistance backend.

## Illustrations des tickets à gratter

Les cinq illustrations `assets/dashboard/rewards/scratch-tier-*.png` représentent
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

Le carousel du dashboard conserve une hauteur fixe. Les cartes gardent un inset
vertical symétrique dans le contour pointillé; la barre de défilement horizontale
reste visible et utilisable. Son état vide centre son
contenu; quand plusieurs cartes sont disponibles, une scrollbar horizontale
violet-magenta permet de les parcourir sans étirer les tickets. Les cartes
restent entières et le bouton conserve une piste assez haute pour garder un
espacement régulier autour du palier.

Dans « Activité réelle / Derniers tickets », chaque ligne est une carte à
coins arrondis avec un retrait intérieur régulier. Le ticket le plus récent
garde une bordure et une surface de mise en évidence distinctes.
