# Audit UX des dashboards utilisateur et administrateur

## Réévaluation des blocs Admin, 2026-11-06

**État au 6 novembre : corrections source appliquées, build Docker frontend
réussi et captures responsive disponibles.** Les captures de la première passe
couvrent les neuf routes Viewer/Admin en desktop et mobile. Des recaptures
ciblées après les derniers correctifs couvrent le cockpit Admin et la page Lots.
Cette section complète l’audit du 3 octobre sans remplacer ses constats
historiques.

### Périmètre et preuves

- Les neuf routes capturées sont `/dashboard`, `/dashboard/recompenses`,
  `/admin`, `/admin/announcements`, `/admin/audit`, `/admin/lots`,
  `/admin/moderation`, `/admin/raffles` et `/admin/users`. Le contenu Admin est
  rendu par le cockpit ou les pages V3 depuis `AdminSectionPage`; les deux
  espaces utilisent le cadre partagé.
- Référence structurelle Viewer : `/dashboard`, avec un hero et trois KPI
  centrés, puis les panneaux Récompenses, Tirage et Activité.
- Le fichier local de résultats `results.json` contient 18 captures, soit ces
  neuf routes aux viewports `1440×960` et `390×844`. Les appels API de ces
  captures sont interceptés et servis par des fixtures en mémoire; aucune
  requête n’atteint le backend et aucune donnée n’y est écrite. Il s’agit d’une
  session UI simulée, pas d’une preuve d’authentification réelle.
- Les 42 captures du sous-dossier `admin` dans
  [`dash-v3-final-captures`](../quality/evidence/dash-v3-final-captures/README.md)
  datent du 11 octobre 2026 et sont rattachées au commit
  `bf91861261e77e134b734e8134dd6fb959d54533`. Elles permettent une comparaison
  historique aux largeurs 1280, 768 et 320 px, mais ne prouvent pas le rendu du
  code courant.
- Les captures de la première passe sont complétées par les recaptures ciblées
  décrites dans la section de vérification. Elles n’étendent pas la preuve
  d’authentification ou de comportement avec des données réelles.

### Matrice de structure avant corrections

| Page | Blocs et organisation identifiés dans le code | Écart initial relevé |
| --- | --- | --- |
| `/admin` | Hero de synthèse, quatre KPI, tableaux Tirages et Lots, annonces, signalements et journal d’audit. | Le hero existant constitue la référence Admin; les panneaux opérationnels gardent leur structure métier. |
| `/admin/lots` | En-tête Inventaire, panneau stock avec quatre mini-KPI, recherche et filtre stock, tableau, actions et drawer d’édition. | En-tête distinct du hero Viewer; indicateurs et tableau nécessitaient un style commun plus lisible. |
| `/admin/announcements` | En-tête, bibliothèque avec onglets et compteurs, recherche/période, liste; panneau d’édition avec onglets édition/révisions/historique et chronologie. | En-tête et collection denses spécifiques à cette page. |
| `/admin/raffles` | Liste sélectionnable et états chargement/vide, détails conditionnels, actions, lot et dates, trois indicateurs conditionnels du tirage sélectionné, progression/exécution, éligibilité, récompenses et traçabilité. | En-tête et liste spécifiques; les indicateurs n’apparaissent qu’avec un tirage sélectionné. |
| `/admin/moderation` | Titre et description, onglets Signalements/Utilisateurs suivis, quatre KPI, filtres, liste paginée et détail vide ou sélectionné. | En-tête et indicateurs utilisaient des règles dédiées. |
| `/admin/users` | En-tête Utilisateurs et sécurité, quatre KPI, recherche et filtres rôle/statut, tableau des comptes/actions, panneau de détail sélectionné ou vide. | En-tête et indicateurs utilisaient des règles dédiées. |
| `/admin/audit` | Titre et total d’événements, quatre KPI, filtres action/entité/acteur, liste paginée, panneau de preuve sélectionnée, chronologie et métadonnées JSON. | En-tête et indicateurs utilisaient des règles dédiées. |

### Constats initiaux de la passe du 6 novembre

1. **P1 — En-têtes Admin hétérogènes.** Avant le correctif, le hero Viewer et
   l’overview Admin coexistaient avec des panneaux compacts ou des titres sans
   surface sur les autres routes. Les contenus métier et actions devaient rester
   propres à chaque page.
2. **P2 — Icônes manquantes dans plusieurs KPI.** Modération, Utilisateurs et
   Audit n’avaient pas d’icône par tuile, contrairement à Viewer, overview,
   Lots et aux indicateurs conditionnels Tirages.
3. **P2 — Hauteur et scroll des listes denses à contrôler.** Lots, Utilisateurs,
   Tirages, Audit, Modération et Annonces ont des collections longues qui
   doivent rester bornées sans étirer leurs panneaux.
4. **P3 — Règles d’en-tête secondaires redondantes.** Les anciens sélecteurs
   route-spécifiques pouvaient diverger du style partagé.

### Corrections réalisées

- Les six routes Admin secondaires réutilisent le composant
  `AdminPageHeader`; la surface, la bordure, le rayon, l’ombre, les titres et la
  typographie utilisent les tokens partagés Viewer. Les actions, textes et
  hiérarchies métier restent propres à chaque route.
- Les KPI de Modération, Utilisateurs et Audit ont reçu des pictogrammes
  fonctionnels PNG. Ils restent limités aux tuiles KPI; le corps opérationnel
  n’a pas reçu d’icônes décoratives.
- Les tuiles KPI Viewer et Admin partagent une règle de centrage de l’icône, du
  libellé et de la valeur.
- Les sept liens de navigation Admin utilisent les PNG du registre `SkkupIcon`
  avec le même wrapper et les mêmes tokens de taille que Viewer. Le titre
  générique « Menu » a été retiré; le libellé accessible de la navigation reste
  présent en français et en anglais.
- Le panneau « Signalements » est placé hors de la surface hero/KPI, avant la
  grille opérationnelle Tirages/Lots. Son contenu, son compteur et ses actions
  restent inchangés.
- Les listes d’Annonces, Audit, Lots, Modération, Tirages et Utilisateurs
  consomment `.skuup-admin-scroll-area`: hauteur bornée par
  `clamp(16rem,48vh,34rem)`, défilement interne et scrollbar violette. En vue
  cartes mobile, la liste Lots garde aussi cette borne et ce défilement.
- Les styles de titres route-spécifiques remplacés ont été retirés. Le
  comportement partagé et ses limites sont documentés dans `frontend/README.md`;
  cette synthèse est répertoriée dans `docs/README.md`.

### Vérifications après correction

- Build Docker du frontend depuis la branche de correction : Next.js compile,
  vérification TypeScript et génération des routes réussies. L’aperçu isolé
  utilise `localhost:3010`; le service est le frontend construit pour la
  branche. Les captures ciblées ci-dessous répondent HTTP 200. Les requêtes API
  sont interceptées en mémoire; aucun backend ni jeu de données réel n’est
  utilisé pour cette QA.
- ESLint ciblé sur les fichiers TypeScript/TSX modifiés : réussi avec Node
  partagé v26.10.0. Aucun test automatisé n’a été lancé.
- La première passe responsive capture les neuf routes listées ci-dessus aux
  viewports `1440×960` et `390×844`. Le rapport indique HTTP 200, largeur du
  document égale à la largeur du viewport et aucune erreur JavaScript pour les
  18 rendus. Les réponses API sont toutes simulées en mémoire.
- Après la correction des en-têtes du tableau Tirages et du libellé de stock,
  les recaptures ciblées couvrent `/admin` et `/admin/lots` aux mêmes deux
  viewports. Le paquet local de preuves comprend `final-targeted-retake.json`,
  `admin-desktop-final.png`, `admin-mobile-final.png`, `lots-desktop-final.png`
  et `lots-mobile-final.png`. Sur desktop, les cinq en-têtes Tirages ont chacun
  16 px d’écart; le tableau Lots n’affiche qu’un seul libellé « Stock » dans
  son en-tête. Sur mobile, la page Lots reste dans la largeur de 390 px et les
  actions « Modifier » et « Supprimer » sont empilées sous les informations du
  lot. Les captures n’atteignent pas l’API réelle et ne prouvent pas le flux
  d’authentification.
- Les données et captures sont des fixtures locales; aucune donnée backend
  n’a été modifiée. Aucun test automatisé n’a été lancé. Le build seul n’est
  pas une preuve visuelle; les captures et mesures ci-dessus constituent la
  preuve responsive simulée.

### Prochaine action

La couverture responsive simulée et les recaptures ciblées sont documentées.
La prochaine étape est de terminer les gates de revue et de livraison de la
carte; ne pas présenter ces captures simulées comme une validation de
l’authentification ou des données réelles.

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
