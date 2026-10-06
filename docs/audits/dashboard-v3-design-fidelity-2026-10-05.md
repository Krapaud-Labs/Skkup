# Audit design fidelity DASH-V3

Date : 2026-10-05  
Périmètre : maquettes principales viewer/admin, preuves rendues 1280 px, shell et responsive  
Statut : needs-review

## Références comparées

- `docs/design/skkup-dashboard-references/dashboard-viewer-principal.png`
- `docs/design/skkup-dashboard-references/dashboard-admin-principal.png`
- `docs/design/evidence/dashboard-viewer-1280.png`
- `docs/design/evidence/dashboard-admin-1280.png`
- `docs/design/dashboard-v3-viewer-spec.md`
- `docs/design/dashboard-v3-admin-spec.md`

## Constats viewer

### P0 structure

- Le rail rendu utilise une composition violette avec une carte de marque haute et un profil en bas. La maquette cible un rail sombre pleine hauteur, une marque compacte et une navigation de six domaines avec extension persistante.
- Le contenu rendu est organisé autour d'un hero « Ton espace de progression » avec plusieurs cartes verticales. La maquette cible une grille opérationnelle dense : trois métriques en tête, une zone de visionnage principale, l'extension en colonne secondaire, récompenses et tirages côte à côte, puis activité récente.
- Le rendu observé affiche des états vides à plusieurs endroits alors que la maquette de référence présente des zones chargées. Ces zones doivent rester honnêtes en production, mais la composition chargée doit être réalisable lorsque les contrats renvoient réellement les données.

### P1 hiérarchie et spacing

- Le header du rendu ne reprend pas la paire notification + identité + menu de la maquette.
- Les cartes sont trop hautes et trop espacées verticalement. La grille cible des sections de 16 px de rayon, des gaps réguliers et des colonnes équilibrées.
- Le logo et le rail occupent proportionnellement trop de hauteur par rapport à la zone de données.
- Les actions de section et les liens « voir tout » ne sont pas uniformes entre les blocs.

### P1 responsive

- Le rail mobile doit devenir un menu compact contrôlable, pas seulement une barre défilante.
- À 768 px, la grille doit conserver une colonne principale et une colonne secondaire réduite avant de passer à une colonne unique.
- À 320 px, les tableaux et cartes doivent s'empiler sans débordement horizontal et les actions principales doivent rester atteignables.

## Constats admin

### P0 structure

- Le rendu admin observé ressemble à une page éditoriale longue avec un hero « Back-office Skkup ». La maquette cible un cockpit dense : barre de contexte, titre, quatre KPI, tirages et lots en parallèle, éditorial, signalements et timeline d'audit.
- La navigation du rendu utilise un sous-ensemble de domaines différent de la maquette. Le shell peut partager les tokens et le rail du viewer, mais les huit destinations admin doivent rester présentes et ordonnées selon la spécification.
- Les panneaux rendus ne reproduisent pas les tables denses à colonnes, badges, miniatures et actions compactes de la référence.

### P1 hiérarchie et spacing

- La maquette admin n'a pas de hero marketing haut. Le titre doit commencer dans le contenu opérationnel après le context bar.
- Les KPI doivent avoir une hauteur et une densité identiques, avec icône, valeur contractuelle, comparaison contractuelle et lien de domaine.
- Les surfaces doivent être alignées sur une grille commune. Les zones tirages/lots et éditorial/signalements/audit ne doivent pas être des blocs verticaux isolés.
- Le header doit conserver le contexte, les notifications et le compte sans inventer d'environnement, d'identité ou de compteur.

### P1 responsive

- À 768 px, les tables doivent passer en cartes contextualisées ou en défilement local annoncé, sans étendre toute la page.
- À 320 px, le rail doit se replier en menu accessible, les KPI doivent s'empiler et les actions d'une ligne doivent rester regroupées.
- Les panneaux secondaires ne doivent pas conserver une largeur fixe issue du desktop.

## Proposition de correction séquencée

1. Stabiliser un `DashboardShell` partagé : rail, zone principale, context header, identité, responsive et tokens communs.
2. Recomposer le viewer autour de la grille de la maquette : métriques, visionnage, extension, récompenses, tirages et activité.
3. Recomposer l'admin autour du cockpit : quatre KPI, deux panneaux opérationnels, éditorial, sécurité et audit.
4. Réutiliser uniquement les composants de données réelles et leurs états loading, empty, error et permission. Aucun fixture de production.
5. Ajouter les transitions Framer Motion uniquement aux changements de section et d'état, avec `prefers-reduced-motion`.
6. Vérifier chaque route à 1280, 768 et 320 px avec une session authentifiée de test autorisée. Sans cette session, conserver le statut de preuve manquante.

## Porte de livraison

Cet audit ne valide pas la conformité finale. `docs/design/design-readiness.md` est encore en `Status: draft`, et aucun agent frontend, QA ou auditeur n'est exposé dans la session pour produire les preuves spécialisées exigées. Aucune modification produit ni livraison vers `dev` ne doit être déduite de ce rapport.

## Vérification navigateur

Le 2026-10-05, le parcours `http://localhost:3000/dashboard` a été ouvert dans le navigateur local avec le profil Chrome Skkup. Après stabilisation, l'application a redirigé vers `/connexion` et a affiché le formulaire d'authentification. Aucune session viewer ou admin authentifiée n'était disponible. Les captures 1280, 768 et 320 px en état chargé restent donc non prouvées.

## Addendum de reprise du Goal

Le 2026-10-05, une session locale autorisée a permis de vérifier les routes `/dashboard`, `/admin` et `/admin/users` dans Chrome à la largeur desktop disponible. Le viewer rend bien sa grille de métriques, visionnage, extension, récompenses, tirages et activité après stabilisation des données. Le cockpit admin rend ses KPI, tableaux opérationnels, éditorial, modération et audit. L'écran `/admin/users` partage désormais le rail, la navigation et la topbar du shell principal, vérifié après reconstruction Docker.

Corrections vérifiées depuis le constat initial :

- `d4012a2` ajoute la topbar commune aux écrans admin secondaires.
- `cb49fda` aligne les proportions et les alignements du rail admin sur le viewer.
- `9913533` retire un onglet de modération non interactif présenté à tort comme contrôlable.

La preuve responsive multi-largeurs et la comparaison pixel à pixel avec les maquettes restent ouvertes. Cet addendum ne transforme pas l'audit en validation finale.
