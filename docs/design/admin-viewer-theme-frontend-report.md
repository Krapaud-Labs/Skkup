# Revue Frontend du shell viewer et administration

agent_role: frontend
agent_id: /root/frontend_password_menu
status: accepted
scope: Parité effective du shell Viewer/Admin, cascade CSS, géométrie desktop et points de rupture responsive
evidence: QA post-clamp rapportée par le coordinateur: rails identiques à 1920 (256px, main x304) et 1280 (224px, main x262); aucun overflow/collision à 768/390/320; mock auth uniquement
next_action: Aucune correction de parité visuelle restante; l’authentification réelle n’est pas couverte par la QA

## Résumé

Le viewer constitue déjà la meilleure base pour le shell visuel partagé. Les deux espaces utilisent les mêmes valeurs `--dashboard-*` et plusieurs mêmes classes de navigation. L’administration recopie néanmoins le markup du shell dans son composant `Shell` et empile des règles spécifiques et historiques dans son CSS de cockpit. L’approche recommandée est d’extraire le cadre présentational depuis le viewer, puis de le consommer depuis les deux espaces, tout en gardant distincts l’autorisation admin, les routes, les actions métier et la densité des données.

Cette revue compare le code source; elle ne constitue pas une comparaison du rendu pixel par pixel dans un navigateur.

Les constats et recommandations initialement consignés ci-dessous forment le
snapshot de l’audit antérieur. Les sections « Mise en œuvre Frontend » et
« Limites » décrivent l’état actuel et les validations encore ouvertes.

## Architecture actuellement observée

### Viewer

`frontend/src/components/dashboard/DashboardSas.tsx:90-125` charge le profil viewer et passe le logo, `NavigationDashboard`, `TopbarDashboard` et le contenu à `DashboardFrame`.

### Administration

`frontend/src/components/admin/AdminSas.tsx:15-60` effectue le contrôle distinct du rôle `ADMIN`, gère les nouvelles tentatives de chargement et expose le profil dans `AdminProfilContext`.

`frontend/src/components/admin/AdminSectionPage.tsx:62-126` utilise le même `DashboardFrame`, avec la variante admin, `NavigationAdmin`, le topbar en mode admin et un titre de section. Le garde `AdminSas` reste distinct. Les composants de sections V3 (`RafflesAdminV3`, `LotsAdminV3`, `AnnouncementsAdminV3`, `UsersAdminV3`, `ModerationAdminV3`, `AuditAdminV3` et `GestionContenu`) rendent ce shell.

La page d’accueil `/admin` emploie le même `Shell`, ajoute `skuup-admin-main-cockpit` et importe `frontend/src/app/admin/cockpit.css`. Ce CSS est donc spécifique au cockpit; les sections admin secondaires dépendent surtout des règles de `globals.css`.

### Éléments déjà partagés

- `NavigationDashboard` et `NavigationAdmin` utilisent les mêmes primitives de rendu (`skuup-dashboard-actions`, `skuup-premium-dashboard-nav-group`, `skuup-dashboard-sidebar-links`, `skuup-dashboard-action`). Leurs définitions de liens, libellés, routes et règles restent séparées. L’administration ajoute un lien de retour vers l’espace viewer.
- `TopbarDashboard` est déjà consommé par le viewer et l’administration. Son mode `admin` désactive le positionnement et le comportement du popover de notifications viewer.
- Les shells viewer et admin déclarent les mêmes valeurs pour `--dashboard-panel`, `--dashboard-panel-raised`, `--dashboard-line`, `--dashboard-accent` et `--dashboard-accent-strong` dans `frontend/src/app/globals.css:653-671`.

## Écarts et risques structurels

1. **CSS cockpit en couches.** `frontend/src/app/admin/cockpit.css` contient 686 lignes de variantes du cockpit, avec plusieurs passes de règles pour les mêmes KPI, panneaux, en-têtes et états. Les premières règles incluent des valeurs cyan/bleu/violet écrites directement; les couches tardives rétablissent certains tokens sans uniformiser toute la composition. Les tailles typographiques fluides restent propres au cockpit (`cockpit.css:525-575`). Cette cascade rend les changements difficiles à prévoir et peut diverger du viewer.

2. **Sélecteurs de rail qui ne correspondent pas au JSX.** Plusieurs règles responsive de `globals.css` et `cockpit.css`, ainsi que `cockpit.css.test.ts`, ciblent `.skuup-premium-dashboard-sidebar`. Les shells réels rendent l’élément `<aside>` avec `.skuup-premium-dashboard-nav` (`DashboardSas.tsx:94-96`, `AdminSectionPage.tsx:78-80`). La recherche du premier nom ne trouve aucun composant TSX qui l’emploie; ces règles de rail ne s’appliquent donc pas au markup actuel. Le test concerné vérifie la présence textuelle du sélecteur dans le CSS plutôt que son appariement au DOM.

3. **Sélection de variante liée à la forme du DOM.** `globals.css` emploie `:has(.skuup-admin-main-cockpit)` pour distinguer les routes de cockpit des autres routes admin. Un déplacement du marqueur cockpit peut modifier l’application des styles sans changement explicite de variante.

4. **Ancien code conservé dans le composant de shell.** `AdminSectionPage.tsx` contient encore les anciennes implémentations pré-V3, avec `eslint-disable @typescript-eslint/no-unused-vars`, tandis que le dispatch effectif vers les composants V3 est à la fin du fichier. Cela augmente le bruit lors des changements du shell.

5. **Couverture visuelle non établie par cette revue.** Le code montre des intentions de parité, mais cette inspection n’a pas observé les deux espaces dans un navigateur à plusieurs viewports. Il faut vérifier le rendu après implémentation, surtout le rail mobile, les blocs de données et les états vides.

## Refactor minimal conseillé

1. Extraire le markup présentational de `DashboardSas` dans un `DashboardFrame` ou `DashboardShell`: grille, rail, brand, zone principale, topbar et contenu. Garder au départ les classes et le rendu viewer inchangés afin que le viewer demeure la source de vérité visuelle.
2. Faire utiliser ce cadre par le viewer et `AdminSectionPage.Shell`. Ne pas fusionner `DashboardSas` avec `AdminSas`: le chargement du profil et la vérification `ADMIN` restent dans la frontière de sécurité admin.
3. Passer au cadre des slots ou composants explicites pour le logo/label, le contenu de navigation, la variante de topbar et le contenu principal. Garder les cartes de navigation viewer/admin séparées; ne partager que leur composant de rendu lorsque cela évite réellement une duplication.
4. Centraliser l’apparence commune des en-têtes, panneaux, KPI, états vides, focus et scrollers autour des tokens du viewer. Autoriser à l’admin une densité opérationnelle spécifique et ses tables, filtres et actions, sans modifier leurs comportements métier ni la sémantique des couleurs d’état.
5. Remplacer les règles `:has` par une variante explicite du cadre et supprimer ou migrer les règles admin redondantes au fil des routes. Corriger en priorité les sélecteurs de rail qui ne correspondent plus au JSX.

## Fichiers à partager ou préserver

| Fichier | Recommandation |
| --- | --- |
| `frontend/src/components/dashboard/DashboardSas.tsx` | Source du markup visuel viewer; extraire le cadre présentational sans déplacer son contrôle de profil initialement. |
| `frontend/src/components/admin/AdminSas.tsx` | Conserver le garde de rôle, les retries et le contexte admin. |
| `frontend/src/components/admin/AdminSectionPage.tsx` | Remplacer son shell dupliqué par le cadre partagé; conserver les labels/sections admin et composants métier dédiés. |
| `frontend/src/components/dashboard/NavigationDashboard.tsx` | Conserver la liste de routes viewer; réutiliser seulement un rendu de lien commun si utile. |
| `frontend/src/components/admin/NavigationAdmin.tsx` | Conserver la liste, les routes et l’accès retour propres à l’admin. |
| `frontend/src/components/dashboard/TopbarDashboard.tsx` | Garder le composant partagé et ses différences explicites viewer/admin. |
| `frontend/src/app/globals.css` et `frontend/src/app/design-tokens.css` | Source des tokens communs; éliminer les redéfinitions identiques et réconcilier les sélecteurs avec le DOM. |
| `frontend/src/app/admin/cockpit.css` | Limiter aux besoins de densité et de layout propres au cockpit, avec moins de règles en cascade. |

## Mise en œuvre Frontend

Le cadre partagé `DashboardFrame` est désormais utilisé par les deux espaces.
La feuille `cockpit.css` conserve la géométrie et la densité du contenu cockpit,
mais les règles finales alignent hero, KPI, panneaux, vignettes,
typographie de titre, actions de ligne et barres de défilement sur les tokens
Viewer. Les couleurs des états métier restent intactes. La règle responsive
admin à 900 px cible désormais `.skuup-premium-dashboard-nav-group`, présente
dans `NavigationAdmin`, au lieu de chercher une navigation imbriquée qui
n’existe pas. Les deux règles restantes de navigation sous
`.skuup-admin-main-cockpit` ont été supprimées: le rail `<aside>` est sibling
du contenu cockpit dans `DashboardFrame`; sa mise en forme appartient au cadre
partagé.

La dernière inspection de la cascade a trouvé une déclaration admin historique
`.skuup-premium-admin-shell .skuup-premium-dashboard-nav { width: auto; ... }`
à `globals.css:2636`, redondante et source de divergence potentielle; elle a été
retirée. Les sélecteurs responsives
`.skuup-premium-admin-shell > .skuup-premium-dashboard-nav .skuup-dashboard-sidebar-links`
sont limités aux media queries mobile/tablette, et aucune règle desktop gagnante
ne leur attribue une largeur ou un track distinct. Pour rendre la géométrie
admin explicite face à toute règle de même spécificité, le cadre admin partagé
fixe désormais `minmax(0, 16rem) minmax(0, 1fr)`, la largeur/max-width du rail
et le padding du contenu à ceux du Viewer. Aucun nouveau rendu n’a encore été
observé après ce delta; le rebuild et la comparaison CUA restent à faire.

Fichiers modifiés dans cette mise en œuvre :

- `frontend/src/app/admin/cockpit.css`
- `frontend/src/app/globals.css`
- `frontend/README.md`
- `docs/06-frontend-design-system.md`

L’observation CUA du coordinateur à 1920×875 a établi que `/dashboard` avait
un fond bleu marine et un rail d’environ 255 px, alors que `/admin` avait un
fond gris-noir, un rail d’environ 287 px et un CTA cyan. L’inspection CSS a
trouvé trois causes directes au shell incohérent: `background:#071426` sur
`.skuup-premium-admin-shell`, deux déclarations
`grid-template-columns:clamp(16.5rem, 19vw, 20rem) ...`, et plusieurs règles
admin spécifiques de rail mobile, dont des dimensions `!important` et une
navigation horizontale sous 900 px. Ces règles contradictoires ont été
supprimées pour laisser `.skuup-dashboard-shared-frame` contrôler le fond
radial bleu nuit `#06142d`, les tokens Viewer et le track desktop de `16rem`.
Les overrides de fond et de géométrie du `<aside>` ont également été retirés
de `cockpit.css`; son layout reste limité au contenu admin.

Après un rebuild antérieur, le coordinateur a constaté que le rail admin
occupait environ 287 px contre 255 px côté Viewer et que son contenu commençait
plus à droite. La dernière inspection a retrouvé une déclaration admin historique
`.skuup-premium-admin-shell .skuup-premium-dashboard-nav { width:auto; ... }`,
qui a été retirée. Les sélecteurs
`.skuup-premium-admin-shell > .skuup-premium-dashboard-nav .skuup-dashboard-sidebar-links`
ne ciblent le layout desktop: ils sont dans des media queries jusqu'à 900px.
La règle commune fixe le track à `16rem`, le rail à `width:100%` avec
`box-sizing:border-box`, `min-width:0` et `max-width:100%`; le contenu reçoit
le padding commun. La déclaration historique du shell
`.skuup-premium-dashboard-shell { grid-template-columns: clamp(14rem, 15vw,
16rem) ... }` résout également à `16rem` à 1920px. Les sources statiques donnent
donc un track attendu de 256px dans les deux espaces et n'expliquent pas l'écart
mesuré dans cette observation antérieure.

À la suite d’une observation du rendu admin à 1920×875, le CTA primaire gardait
encore le style `.skuup-button` historique. `globals.css` applique maintenant
aux `.skuup-button-primary` admin le même dégradé violet vers
`--color-accent-cta`, le texte `--color-background`, la forme capsule, le
padding CTA et l’ombre au survol de `BoutonCTA`, sans toucher aux commandes
viewer ni aux tailles minimales admin.

## Vérification finale rapportée par le coordinateur

Le coordinateur rapporte qu’un nouveau build Docker à 15:38Z a terminé
`next build` et TypeScript sans erreur, avec 29 routes produites, et que le
conteneur `frontend` est `healthy`. En CUA, il a rechargé `/admin` à 1920×873 et
observé un rendu stable: fond navy, rail, navigation, topbar, KPI, tableaux,
CTA capsule, données et actions admin visibles. Après une première ouverture en
chargement, il a également repris `/dashboard` et confirmé son rendu stable sur
le même build à 1920×873.
Ces éléments sont des preuves rapportées par le coordinateur, pas une observation
directe de l’agent Frontend. La mesure initiale avant correction puis la mesure
desktop après build sont détaillées ci-dessous. Les viewports mobile et tablette
restent non vérifiés. Aucun test suite n’a été lancé dans la présente tâche.

Avant la correction, le coordinateur a relevé les styles calculés à 1920×873:
les deux rails font 256px et le gap vaut 48px, mais `/dashboard` commence à x=0
tandis que `/admin` commence à x=32; le contenu démarre respectivement à x=304
et x=336.
La cause CSS est la règle gagnante `.skuup-premium-dashboard-shell:not(.skuup-premium-admin-shell)`
qui donne `padding:0` au Viewer, tandis que l’Admin recevait le padding générique
`clamp(1rem, 2vw, 2rem)` du cadre partagé (32px à cette largeur). La règle
commune `.skuup-dashboard-shared-frame` fixe maintenant le padding à `0` pour
les deux variantes. Après ce changement, `docker compose build frontend` a
terminé `next build` et TypeScript avec succès, 29 routes ont été générées, et
`docker compose ps frontend` a renvoyé `healthy`. Le coordinateur a ensuite
observé les deux pages fraîches CUA à 1920×873: les cadres ont padding `0`,
tracks de `256px` et `1616px`, gap `48px`, nav en `x=0` (largeur `256px`), main
en `x=304` (largeur `1616px`) et `body.scrollWidth=body.clientWidth=1920px`.
La mesure confirme l’alignement desktop après correction; la vérification des
tailles 768, 390 et 320 px est détaillée dans la QA post-clamp ci-dessous.

La QA suivante a mesuré à `1280px` le Viewer avec un rail de `224px` et le
contenu en `x=262`, tandis que l’Admin gardait un rail de `256px` et le contenu
en `x=294`. La cause est le track commun resté fixé à `16rem`, alors que la règle
Viewer gagnante utilise `clamp(14rem, 15vw, 16rem)`. Cette expression remplace
maintenant le track fixe du cadre partagé; à 1280px elle doit donner `224px` aux
deux côtés. Le rebuild après ce changement a terminé avec Next.js et TypeScript
sans erreur, 29 routes, puis le conteneur frontend est revenu `healthy`.

La QA coordinateur post-clamp a confirmé les deux dashboards alignés à `1920px`
(rail `256px`, contenu `x=304`) et `1280px` (rail `224px`, contenu `x=262`). À
`768`, `390` et `320px`, elle n’a observé ni débordement horizontal ni collision,
et a confirmé l’empilement de la navigation. Seule l’authentification mock a été
utilisée; aucune session d’authentification réelle n’a été couverte. L’audit
visuel et fonctionnel des permissions ou de l’authentification n’est pas inclus.

Pour ce dernier changement, `npm run lint` a terminé avec zéro erreur et six
avertissements préexistants. `docker compose build frontend` a terminé
`next build` et TypeScript avec succès et généré 29 routes; le service a ensuite
été recréé et déclaré `healthy`. La suite de tests n’a pas été exécutée. Le
rendu après ce dernier build est couvert par la QA coordinateur ci-dessus.

## Limites

Revue limitée au cadre et aux styles Frontend concernés. Les captures et mesures navigateur sont rapportées par le coordinateur; elles ne constituent pas une observation directe de l’agent Frontend. L’authentification réelle n’a pas été vérifiée.
