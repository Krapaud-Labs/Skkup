# Audit QA shells DASH-V3

Date : 2026-10-05
Rôle : QA responsive et accessibilité
Statut : needs-review

## Périmètre

- Shell viewer `DashboardSas` et navigation `NavigationDashboard`
- Shell admin `AdminSas` et navigation `NavigationAdmin`
- Largeurs cibles : 1280, 768 et 320 px
- Navigation clavier
- `prefers-reduced-motion`

## Preuves d’exécution

Le navigateur local BrowserAct a chargé `http://localhost:3000/connexion` avec un viewport observé de `1920 × 993`. Les routes authentifiées ne sont pas accessibles dans la session disponible : les parcours `/dashboard` et `/admin` redirigent vers `/connexion`. Aucune session, identité ou donnée n’a été inventée.

Preuve sauvegardée : `docs/audits/qa-shell-login-1280.png`.

La capture porte donc sur l’écran public de connexion et ne constitue pas une validation visuelle des shells authentifiés. Les captures 1280 × 768, 768 × 1024 et 320 × 844 restent à produire avec une session authentifiée ou un mécanisme de test autorisé.

## Clavier

Test réel sur la page de connexion : après deux pressions `Tab`, le focus suit une séquence visible et déterministe :

1. lien logo `Accueil Skkup`
2. lien `Comment ça marche`

Les contrôles inspectés sont des liens, champs `input` et bouton natifs sans `tabindex` artificiel. Cette preuve ne couvre pas encore les contrôles rendus uniquement après authentification.

## Reduced motion

Le navigateur observé retournait `matchMedia('(prefers-reduced-motion: reduce)').matches = false`.

Le CSS contient des garde-fous `prefers-reduced-motion` pour les transitions de navigation et les animations de chargement. Le viewer utilise `useReducedMotion` sur l’animation englobante, mais les quatre animations enfants de `TableauDeBord.tsx` conservent des `initial`, `animate` et `transition` indépendants. Leur absence d’animation en mode réduit n’est donc pas prouvée et doit être corrigée ou testée explicitement.

Preuves :

- `frontend/src/components/dashboard/TableauDeBord.tsx:345-393`
- `frontend/src/app/admin/page.tsx:27-35`
- `frontend/src/components/admin/AdminSectionPage.tsx:24-30`
- `frontend/src/app/globals.css:648-650`

## Responsive statique

Les règles existent pour les trois seuils demandés, mais elles ne remplacent pas une capture rendue :

- `max-width: 1280px` réduit la largeur de la sidebar admin et passe plusieurs grilles en une colonne.
- `max-width: 768px` rend la navigation admin horizontale et compacte.
- `max-width: 320px` empile les KPI admin et réduit les espacements.
- Le viewer conserve une navigation horizontale défilante sous `900px`, ce qui ne prouve pas le menu compact accessible attendu par la conception.

Preuves : `frontend/src/app/globals.css:1900-1937` et `frontend/src/app/globals.css:741-758`.

## Verdict

Audit non validant. Aucun agent QA ne valide seul la Definition of Done.

Éléments prouvés : serveur local accessible, redirection d’authentification, séquence clavier publique, présence des règles responsive et des garde-fous CSS reduced-motion.

Éléments non prouvés ou à corriger :

- rendu authentifié des deux shells aux trois tailles ;
- absence d’overflow et comportement mobile réel ;
- navigation clavier complète viewer/admin ;
- reduced-motion des animations enfants viewer ;
- parcours interactifs admin authentifiés.
