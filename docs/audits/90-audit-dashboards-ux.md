# Audit UX des dashboards utilisateur et administrateur

## Réévaluation des blocs Admin, 2026-11-06

**État : audit des sources et comparaison visuelle authentifiée terminés au
viewport observé; vérification responsive courante non réalisée.**
Cette section complète l’audit du 3 octobre sans remplacer ses constats
historiques. L’objectif reste de comparer les sept pages Admin au dashboard
Viewer, sans appliquer les corrections priorisées.

### Périmètre et preuves

- Routes Admin vérifiées dans le code courant : `/admin`, `/admin/raffles`,
  `/admin/lots`, `/admin/announcements`, `/admin/moderation`, `/admin/users` et
  `/admin/audit`. Le contenu détaillé est rendu par le cockpit ou les pages V3
  depuis `AdminSectionPage`; les deux espaces utilisent le cadre partagé.
- Référence structurelle Viewer : `/dashboard`, avec un hero et trois KPI
  centrés, puis les panneaux Récompenses, Tirage et Activité.
- Les 42 captures du sous-dossier `admin` dans
  [`dash-v3-final-captures`](../quality/evidence/dash-v3-final-captures/README.md)
  datent du 11 octobre 2026 et sont rattachées au commit
  `bf91861261e77e134b734e8134dd6fb959d54533`. Elles permettent une comparaison
  historique aux largeurs 1280, 768 et 320 px, mais ne prouvent pas le rendu du
  code courant.
- Le QA a inspecté en session Chrome authentifiée les huit écrans (`/dashboard`
  et les sept routes Admin) au même viewport, vers 1920 × 1080 px physiques
  pour la fenêtre visible. Les captures apparaissent dans les sorties CUA de la
  tâche, mais aucune PNG locale n’a été conservée. L’inspection est visuelle et
  n’inclut pas de mesures DOM/CSS pixel par pixel.
- Le rendu courant confirme le centrage des tuiles KPI visibles sur Viewer et
  sur `/admin`, `/admin/lots`, `/admin/moderation`, `/admin/users` et
  `/admin/audit`. Annonces n’a pas de tuiles KPI. Tirages n’a pas de bandeau
  KPI de synthèse; le détail d’un tirage sélectionné comporte trois indicateurs
  conditionnels à icône selon `RafflesAdminV3.tsx`.
- Un ancien essai Playwright isolé avec le storage QA expiré redirigeait
  `/dashboard` vers `/` et les routes Admin vers `/connexion`, sans KPI ni
  capture. Cette tentative ne remplace pas les observations Chrome
  authentifiées ci-dessus.

### Matrice des blocs observés dans les sources

| Page | Blocs et organisation courants | Comparaison au Viewer et limites visuelles |
| --- | --- | --- |
| `/admin` | Hero de synthèse, quatre KPI, tableaux Tirages et Lots, annonces, signalements et journal d’audit. | Hero encadré/dégradé avec logo S, proche du Viewer; ses quatre KPI centrés accompagnent des blocs opérationnels plus denses. La capture courante confirme cette disposition. |
| `/admin/lots` | En-tête Inventaire, panneau stock avec quatre mini-KPI, recherche et filtre stock, tableau, actions et drawer d’édition. | Bannière encadrée compacte avec icône de lot et bouton. Les quatre KPI ont des icônes et un contenu centré. Table longue visible; captures courante et archive concordent sur cette structure. |
| `/admin/announcements` | En-tête, bibliothèque avec onglets et compteurs, recherche/période, liste; panneau d’édition avec onglets édition/révisions/historique et chronologie. | Aucun KPI. Bannière encadrée compacte, bibliothèque et éditeur latéral; composition plus dense que le Viewer, observée dans la capture courante. |
| `/admin/raffles` | Liste sélectionnable et états chargement/vide, détails conditionnels, actions, lot et dates, trois indicateurs conditionnels du tirage sélectionné, progression/exécution, éligibilité, récompenses et traçabilité. | Pas de bandeau KPI de synthèse dans la capture; le code affiche trois tuiles à icône dans le détail d’un tirage sélectionné (`RafflesAdminV3.tsx`). Commence par un panneau de sélection encadré plutôt que par le hero Viewer, puis détail en plusieurs panneaux. Quatre tirages visibles dans la capture courante. |
| `/admin/moderation` | Titre et description, onglets Signalements/Utilisateurs suivis, quatre KPI, filtres, liste paginée et détail vide ou sélectionné. | En-tête sans cadre. Les quatre KPI, sans icône, sont centrés; la liste et le détail sont en deux colonnes. Capture courante. |
| `/admin/users` | En-tête Utilisateurs et sécurité, quatre KPI, recherche et filtres rôle/statut, tableau des comptes/actions, panneau de détail sélectionné ou vide. | En-tête encadré/dégradé, sans logo. Les KPI sont centrés mais sans icône; le tableau des comptes et le détail restent des blocs propres à l’Admin. Capture courante. |
| `/admin/audit` | Titre et total d’événements, quatre KPI, filtres action/entité/acteur, liste paginée, panneau de preuve sélectionnée, chronologie et métadonnées JSON. | En-tête sans cadre. Les KPI sans icône sont centrés; liste d’événements et preuve sélectionnée sont côte à côte. Capture courante. |

### Constats vérifiés et corrections à prioriser

1. **P1 — Unifier le langage des en-têtes Admin autour du cadre Viewer.** Le
   rendu courant confirme cinq traitements distincts: hero complet sur Viewer
   et `/admin`, panneau dégradé sans logo sur `/admin/users`, bannières compactes
   sur `/admin/lots` et `/admin/announcements`, titre sans surface sur
   `/admin/moderation` et `/admin/audit`, panneau de sélection en tête de
   `/admin/raffles`. Harmoniser le traitement commun des titres, marges et
   surfaces tout en gardant les actions et contenus métier propres aux pages.
2. **P2 — Uniformiser les icônes des KPI qui en ont.** Le Viewer, l’overview
   Admin et Lots associent une icône à chaque KPI; le détail d’un tirage
   sélectionné prévoit aussi trois icônes KPI dans le code. Modération,
   Utilisateurs et Audit ont des tuiles centrées mais sans icône. Choisir une
   règle commune conforme au rôle des pictogrammes Admin, limités aux KPI et à
   la navigation; la variante conditionnelle Tirages reste à confirmer à
   l’écran.
3. **P2 — Vérifier les pages longues et le défilement des blocs.** Lots,
   Utilisateurs, Tirages et Audit contiennent des listes ou tableaux denses.
   Vérifier leurs limites de hauteur et leur scroll interne à des viewports plus
   petits; la passe courante ne couvre qu’un viewport.
4. **P3 — Styles secondaires dispersés.** Les sources contiennent plusieurs
   déclarations et overrides route-spécifiques pour `.skuup-premium-panel` et
   les titres de sections. C’est un risque de divergence et de maintenance,
   pas une preuve suffisante d’un écart visuel courant; consolider seulement
   après validation des règles effectivement utilisées.

### Limite de clôture

Le relevé source et la comparaison visuelle courante couvrent les sept routes
Admin et `/dashboard` à un même viewport authentifié. Les captures CUA n’ont pas
été enregistrées en PNG locale et aucun viewport mobile/tablette n’a été
inspecté dans cette passe; les captures du 11 octobre restent les seules
preuves archivées aux largeurs 768 et 320 px. Prochaine action: faire relire
indépendamment la matrice consolidée; la clôture du Goal dépendra de cette
relecture et de la vérification finale de ce document.

## Rapport historique du 3 octobre 2026

Les sections ci-dessous conservent le relevé et l’état de ce lot à la date
indiquée. Ils ne décrivent pas à eux seuls l’état courant, complété dans la
réévaluation du 6 novembre ci-dessus.

### Périmètre

Audit visuel indépendant réalisé dans Chrome sur la version déployée de Skkup, le 3 octobre 2026, avec le compte administrateur autorisé.

Écrans contrôlés :

- `/dashboard`.
- `/admin`.

### Constats initiaux

- Le dashboard viewer utilise bien trois zones, mais la zone centrale conserve une grande surface vide lorsque le nombre d'annonces est faible.
- Le hero et les statistiques viewer sont fusionnés dans une même surface sans séparation visuelle assez nette entre identité et indicateurs.
- La colonne de gauche mélange régularité et récompenses sans hiérarchie explicite.
- La colonne de droite affiche la loterie, mais son état vide ne propose aucune action ni information de calendrier.
- Le dashboard administrateur utilise le même univers graphique, mais sa navigation est visuellement plus lourde et plus dense que celle du viewer.
- La navigation administrateur affichait deux intitulés équivalents « Vue d'ensemble », ce qui rendait la destination viewer ambiguë.
- Les filtres administrateur occupent une surface importante avant les contenus opérationnels.
- Les formulaires, listes et historiques administrateur sont présentés dans une même longue page sans regroupement visuel assez fort par tâche.

### Première correction appliquée

Le lien administrateur vers le dashboard viewer utilise maintenant un intitulé explicite : « Espace viewer » et « Ouvrir le dashboard viewer ». L'intitulé anglais équivalent est également fourni.

### Critères de poursuite

- Conserver une grille viewer lisible avec une colonne centrale prioritaire et deux colonnes secondaires réellement utiles.
- Réduire les surfaces vides dans les états sans données.
- Unifier les dimensions de hero, les espacements, les bordures, les rayons et les états de focus entre viewer et admin.
- Donner une hiérarchie distincte aux actions de navigation, aux contenus métier, aux formulaires et aux historiques.
- Tester les états chargement, vide, erreur, contenu long, modal et viewport mobile.
- Capturer un rendu avant et après pour chaque écran corrigé.

### Preuves

- Rendu Chrome du dashboard viewer : hero, bandeau de statistiques, trois colonnes, annonce et loterie vide observés.
- Rendu Chrome du dashboard administrateur : hero, cinq cartes de navigation, filtres, sponsor et signalements observés.
- `npm run lint` frontend : succès.
- Test `NavigationAdmin.test.tsx` : 1 fichier et 1 test réussis.

### État historique

Le lot de correction est prêt pour livraison. L'intitulé ambigu et l'étirement vertical de la zone d'annonces sont corrigés localement. Les contrôles frontend et responsive passent. La validation visuelle de production après déploiement reste une porte de livraison à exécuter après fusion vers `dev`.
