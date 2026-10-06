# Audit QA indépendant admin DASH-V3

Date : 5 octobre 2026
Statut : needs-review
Périmètre : `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`, `/admin/users`, `/admin/audit`
Limites : lecture seule. Aucun fichier de code, branche, PR ou déploiement modifié.

## Références contrôlées

- `docs/design/dashboard-v3-admin-spec.md`
- `docs/design/skkup-dashboard-references/dashboard-admin-principal.png`
- `docs/design/skkup-dashboard-references/ecrans-secondaires-admin.png`
- `docs/design/skkup-dashboard-references/admin-tirage-detaille.png`
- `docs/design/skkup-dashboard-references/admin-lots-detaille.png`
- `docs/design/skkup-dashboard-references/admin-annonces-contenus-detaille.png`
- `docs/design/skkup-dashboard-references/admin-signalements-utilisateurs-detaille.png`
- composants et routes admin présents dans `frontend/src/`

## Méthode et preuves

- Inspection visuelle directe des six PNG admin, de leurs compositions, grilles, densités, panneaux, états et interactions représentées.
- Inspection statique des huit routes et composants réellement importés.
- `git status --short` : modifications préexistantes non liées dans `.workspace.toml`, `globals.css`, `AnnouncementsAdminV3.tsx`, `AuditAdminV3.tsx` et `ModerationAdminV3.tsx` non suivie.
- `npm run lint` dans `frontend` : échec, une erreur bloquante dans `ModerationAdminV3.tsx:38` (`set-state-in-effect`), deux avertissements `<img>` préexistants dans `RafflesAdminV3.tsx`.
- `docker version` : Docker Desktop 29.8.1 accessible après autorisation.
- `docker build --target build -t skkup-frontend-qa frontend` : échec pendant `next build`, résolution impossible de `@/components/admin/AuditAdminV3` depuis `AdminSectionPage.tsx:14` dans le contexte Docker.
- `npm run build` local : non exploitable, téléchargement SWC bloqué par une permission du cache utilisateur (`EPERM`), sans modifier le dépôt.
- Capture navigateur authentifiée : non obtenue. BrowserAct installé mais son journal système est inaccessible (`PermissionError`), et aucune session admin utilisable n’a été fournie pour cette passe.

## Verdict

**Non conforme et non livrable.** La conformité pixel-perfect et fonctionnelle n’est pas prouvée. Deux contrôles de qualité sont actuellement en échec dans l’état du worktree, en plus des écarts visuels et structurels ci-dessous.

## P0 ouverts

### P0-01 - Cockpit principal incomplet par rapport à la maquette

`/admin` rend des résumés contractuels et des états vides, mais pas la composition dense de `dashboard-admin-principal.png` : lignes denses de tirages et lots avec médias, bloc éditorial opérationnel, file de signalements et timeline structurée. L’état vide honnête est correct mais ne prouve pas la surface cible.

Preuves : `frontend/src/app/admin/page.tsx`, sections opérations, inventaire, éditorial, sécurité et audit.

### P0-02 - Aucun rendu navigateur authentifié comparatif complet

Les huit routes n’ont pas été capturées à 1280, 768 et 320 px pendant cette passe. La conformité visuelle, le comportement des drawers, les tableaux mobiles et les états interactifs restent donc non démontrés.

### P0-03 - Tirages encore sous-denses par rapport au détail de référence

`admin-tirage-detaille.png` attend une composition avec média de lot, progression en étapes, préconditions, alertes de validation, actions de préparation, résultats et timeline riche. Le composant possède une partie de ces données, mais la correspondance de composition et de hiérarchie n’est pas démontrée et reste incomplète selon l’inspection statique.

Preuve : `frontend/src/components/admin/RafflesAdminV3.tsx`.

### P0-04 - Lots incomplets par rapport à l’inventaire de référence

La maquette attend vignette, type, stock, disponibilité, statut, tirage lié, dernière mise à jour, actions, KPI et drawer à onglets Informations/Aperçu. Le composant actuel ne couvre pas toute cette composition de façon équivalente, notamment les métadonnées et le niveau de détail du drawer.

Preuve : `frontend/src/components/admin/LotsAdminV3.tsx`.

### P0-05 - Annonces et contenus non équivalents à la bibliothèque de référence

L’écran ne rend pas la richesse complète attendue : onglets par statut avec compteurs contractuels, type, locale, version, auteur, média, aperçu contrôlé et actions détaillées de publication/restauration. L’éditeur actuel reste plus réduit.

Preuve : `frontend/src/components/admin/AnnouncementsAdminV3.tsx`, `GestionContenu.tsx`.

### P0-06 - Modération non équivalente à la file de dossiers de référence

La maquette attend deux onglets Signalements/Utilisateurs, KPI métier, pagination, table dense, preuves média, contexte utilisateur, timeline et actions de sanction. Le composant actuel conserve une liste et un détail contractuel, mais sans équivalence visuelle prouvée et sans l’ensemble de ces surfaces.

Preuve : `frontend/src/components/admin/ModerationAdminV3.tsx` non suivie et branchement de route à vérifier après intégration.

### P0-07 - Lint en échec sur le composant de modération

`npm run lint` échoue à `ModerationAdminV3.tsx:38` à cause de `setPage(1)` appelé directement dans un effet React. Ce n’est pas un simple écart cosmétique : l’état courant ne satisfait pas le contrôle qualité requis.

### P0-08 - Build Docker en échec sur l’import Audit

Le build Next.js lancé dans Docker échoue à `AdminSectionPage.tsx:14` avec `Module not found: Can't resolve '@/components/admin/AuditAdminV3'`, alors que le fichier existe localement et apparaît comme modification non committée. Cela indique une incohérence entre l’état de travail et l’état intégrable qui doit être résolue et retestée.

## P1 ouverts

### P1-01 - Shell admin non homogène entre cockpit et écrans secondaires

La structure du cockpit et celle de `Shell` ne reprennent pas exactement la même barre de contexte, hiérarchie de titre, compte admin, environnement, navigation et actions que les PNG.

### P1-02 - `/admin/users` reste partiel

Le master-detail couvre le compte et quelques compteurs, mais ne démontre pas les onglets d’activité, signalements liés, extensions, historique admin et contexte riche du panneau de référence.

### P1-03 - `/admin/audit` reste plus pauvre que la timeline de référence

Des filtres et une pagination existent dans l’état courant, mais la timeline lisible, le contexte de mutation, le résultat et la densité de la maquette ne sont pas reproduits ni validés en navigateur.

### P1-04 - Assets et iconographie non uniformes

Certaines zones utilisent des assets générés ou des icônes inline, tandis que d’autres titres, états et actions ne reprennent pas les pictogrammes métiers dédiés des PNG. La cohérence de taille, couleur, alignement et contraste n’est pas démontrée écran par écran.

### P1-05 - Médias et états sans données réelles non comparables

Les états vides évitent les fausses images, conformément à la spécification, mais aucun jeu contractuel authentifié n’a permis de vérifier les vignettes, aperçus, erreurs média et fallback neutres sur toutes les routes.

### P1-06 - Responsive non prouvé

La présence de breakpoints CSS ne constitue pas une preuve. Il manque les captures et parcours à 1280, 768 et 320 px, notamment pour tables, filtres, drawers, panneaux de détail, actions et navigation.

### P1-07 - Parcours métier non vérifiés

Création/modification/suppression protégée de lots, publication et archivage d’annonces, préparation de tirage, traitement de signalement, changement de statut utilisateur et consultation audit n’ont pas été rejoués en navigateur avec leurs succès, erreurs, permissions et confirmations.

### P1-08 - Worktree non stabilisé pour une revue indépendante

Plusieurs changements admin sont non committés ou non suivis. Une comparaison fiable de la branche livrable et de la maquette ne peut pas être clôturée tant que cet état n’est pas intégré, testé et rejoué.

## Points positifs constatés

- Les huit routes admin existent.
- Les composants évitent globalement les données fictives et exposent des états vides contractuels.
- Les lots utilisent les URLs média de l’API lorsqu’elles sont présentes.
- Un drawer lots, des filtres et plusieurs panneaux master-detail existent.
- L’iconographie inline et le retrait du rectangle décoratif du logo sont présents dans l’historique récent.

Ces points ne lèvent aucun P0 de conformité visuelle.

## Conclusion QA

Le statut indépendant est **needs-review**, avec **8 P0** et **8 P1** ouverts. Aucun feu vert de conformité, aucun push, aucun merge et aucune clôture de la carte ne sont justifiés par les preuves actuelles.

La prochaine revue doit d’abord stabiliser l’état intégrable, faire passer lint/build/tests, puis capturer les huit routes aux trois largeurs avec une session admin réelle avant toute conclusion.
