# DASH-V3 - Spécification design administrateur

Statut : `phase design - spécification proposée`
Date : 4 octobre 2026
Références : `dashboard-v3-design-freeze.md`, `dashboard-admin-principal.png`,
`ecrans-secondaires-admin.png`, `admin-tirage-detaille.png`,
`admin-lots-detaille.png`, `admin-annonces-contenus-detaille.png`,
`admin-signalements-utilisateurs-detaille.png`, `docs/design/api-contracts.md`,
`docs/design/content-management.md` et le cahier des charges accepté.

Cette spécification décrit la cible visuelle et comportementale de l'espace
administrateur. Elle ne valide ni l'implémentation actuelle ni la Definition of
Done. Toute donnée affichée doit venir d'un contrat réel ou être remplacée par
un état vide, de chargement ou d'erreur explicite.

## 1. Principes de l'espace admin

L'administration est un cockpit opérationnel, distinct de l'espace viewer. La
structure privilégie la décision et la traçabilité : une action principale par
zone, des indicateurs qui renvoient vers un domaine, des tableaux lisibles et
un historique associé aux mutations sensibles.

- Aucun header public global dans `/admin/*`.
- Une navigation latérale persistante sur desktop, compacte et défilable sur
  mobile.
- Un contexte d'environnement toujours explicite, sans afficher une valeur
  non fournie par le contrat.
- Les compteurs sont des valeurs contractuelles, jamais des estimations CSS.
- Les actions destructives ou irréversibles demandent une confirmation et
  restent désactivées si la permission ou les préconditions manquent.
- Les écrans conservent un titre, un résumé de contexte, une action primaire,
  puis les données détaillées.
- Les erreurs indiquent l'impact et proposent une reprise locale. Elles ne
  masquent pas silencieusement un tableau.

## 2. Shell et composants partagés

### 2.1 Structure globale

```text
AdminSas
└── AdminShell
    ├── AdminSidebar
    │   ├── BrandMark
    │   ├── ContextBadge
    │   ├── AdminPrimaryNav
    │   └── Account/Exit action
    └── AdminMain
        ├── AdminContextBar
        ├── Breadcrumbs ou back action si détail
        ├── PageHeader
        │   ├── Kicker
        │   ├── Title
        │   ├── Description
        │   └── PrimaryActions
        └── PageContent
```

`AdminSidebar` expose les domaines suivants, dans cet ordre : Vue d'ensemble,
Tirages, Lots, Annonces, Contenus, Modération, Utilisateurs et Audit. Le lien
actif est déterminé par la route, possède `aria-current="page"` et reste
visible au clavier.

`AdminContextBar` contient uniquement les informations disponibles :
environnement, lien vers le site public, état de session et notifications si
un contrat les fournit. Une information absente est libellée comme telle, pas
remplacée par « production » ou un compteur fictif.

### 2.2 Composants de contenu

| Composant | Usage | Obligations design |
|---|---|---|
| `AdminPageHeader` | titre et action de la page | titre unique, description courte, action primaire identifiable |
| `AdminMetricCard` | KPI du cockpit | icône SVG cohérente, valeur contractuelle, libellé, lien vers le domaine |
| `AdminDataPanel` | surface de tableau ou liste | titre, compteur si fourni, action secondaire, état intégré |
| `AdminTable` | données comparables | en-têtes explicites desktop, cartes conservant le contexte mobile |
| `AdminStatusChip` | statut métier | texte + couleur, jamais couleur seule |
| `AdminPriorityBadge` | priorité d'un signalement | niveau textuel, contraste et explication au survol/focus |
| `AdminEmptyState` | collection vide | cause connue, prochaine action réelle ou absence d'action annoncée |
| `AdminLoadingState` | chargement | `aria-busy`, squelette structurel sans valeur inventée |
| `AdminErrorState` | échec contrat | code/message utile, réessai lorsque sûr, pas de données périmées présentées comme fraîches |
| `AdminConfirmDialog` | mutation sensible | résumé de l'impact, annuler par défaut, focus piégé et retour après fermeture |
| `AdminAuditTimeline` | traçabilité | acteur, heure, objet, résultat et lien vers le détail |
| `AdminPagination` | collections paginées | page courante, total si fourni, actions clavier et conservation des filtres |

Les icônes suivent l'inventaire V3 et restent décoratives lorsque le libellé
textuel est déjà présent. Aucune icône ne porte seule une action sans nom
accessible.

## 3. `/admin` - cockpit principal

### 3.1 Composition finale

La page reprend la hiérarchie de `dashboard-admin-principal.png` :

1. barre de contexte admin ;
2. titre « Administration Skkup » et résumé de mission ;
3. rangée de KPI illustrés ;
4. panneau « priorité maintenant » ou état vide priorisé ;
5. deux tableaux opérationnels : tirages et lots ;
6. bloc éditorial : annonces et contenus ;
7. bloc sécurité : signalements et utilisateurs ;
8. timeline du journal d'audit récent.

Les quatre KPI recommandés sont : tirages ouverts, lots disponibles,
signalements ouverts et utilisateurs actifs. Les champs exacts proviennent de
`GET /admin/dashboard/summary`; si un champ n'est pas fourni, la carte n'est
pas remplacée par un nombre dérivé.

### 3.2 Tableaux et actions

| Zone | Colonnes / contenu | Action principale | Permission |
|---|---|---|---|
| Tirages à piloter | titre, statut, date, participants ou valeur contractuelle | ouvrir le cockpit du tirage | `ADMIN`, lecture si le contrat l'autorise |
| Lots | nom, visuel, stock, tirage associé | ouvrir l'inventaire ou créer un lot | `ADMIN` |
| Éditorial | annonces actives, contenus publiés, statut | ouvrir annonces ou bibliothèque de contenu | `ADMIN` |
| Sécurité | signalements ouverts, priorité, utilisateurs concernés | ouvrir la modération | `ADMIN` |
| Audit récent | action, acteur, objet, date, résultat | ouvrir l'audit complet | lecture admin protégée |

Le cockpit ne duplique pas les listes complètes : chaque ligne renvoie vers le
domaine avec les filtres pertinents. Une collection vide affiche un état vide
contextuel, par exemple « Aucun tirage ouvert » avec « Créer un tirage » si
l'endpoint et la permission de création existent.

## 4. `/admin/raffles` - cockpit des tirages

### 4.1 Structure

La liste présente les tirages sous forme de lignes denses sur desktop et de
cartes empilées sur mobile : titre, statut, fenêtre de participation, nombre de
participants, lots associés et dernière action auditée. Les filtres sont
persistants dans l'URL si le contrat le permet.

Le détail suit `admin-tirage-detaille.png` :

- en-tête du tirage avec statut et retour à la liste ;
- carte du lot avec image HTTPS fournie, nom, valeur et stock ;
- période, règles d'éligibilité et obligation d'extension ;
- progression participants / tickets uniquement si fournie ;
- panneau de contrôle avec préconditions visibles ;
- confirmation avant fermeture ou exécution ;
- résultat et empreinte cryptographique après succès ;
- timeline auditée de la création à l'exécution.

### 4.2 Actions et permissions

| Action | Préconditions | Permission | Résultat affiché |
|---|---|---|---|
| créer | formulaire valide, lots réels | `ADMIN` | nouveau brouillon ou tirage selon contrat |
| modifier | tirage modifiable | `ADMIN` | version mise à jour, erreur de concurrence visible |
| fermer / exécuter | fenêtre et confirmation respectées | `ADMIN` | résultat audité ou blocage explicite |
| consulter l'historique | tirage accessible | lecture admin | événements, hash et acteur |

L'exécution s'appuie sur le contrat de tirage cryptographique. La graine et
l'entropie ne sont jamais affichées avant l'étape prévue par le protocole et ne
sont jamais conservées dans l'interface après soumission.

## 5. `/admin/lots` - inventaire des lots

### 5.1 Composition

La page est une bibliothèque d'inventaire avec recherche, filtre de stock et
filtre de tirage. Chaque lot affiche une vignette contrôlée, son nom, sa
valeur, son fournisseur, son stock et son association. Les trois états de
stock sont textuels : disponible, stock faible, rupture.

Le panneau de création/édition reprend les mêmes champs que le contrat :
tirage associé, nom, valeur estimée, quantité, fournisseur et URL média si
acceptée. Les erreurs sont attachées au champ et résumées en haut du formulaire.

### 5.2 Actions protégées

- créer et modifier : `ADMIN` ;
- supprimer : `ADMIN`, confirmation obligatoire, refus explicite si le lot est
  déjà engagé dans un tirage non annulé ;
- consulter : session admin autorisée ;
- retour et annulation : toujours disponibles sans mutation.

Une image absente produit un emplacement média neutre, jamais une image de
remplacement présentée comme le lot réel.

## 6. `/admin/announcements` et `/admin/content`

### 6.1 Annonces

`/admin/announcements` liste les annonces avec titre, locale, période d'activité,
statut et date de dernière modification. Le détail permet modifier, activer,
désactiver, consulter l'historique et restaurer une version lorsqu'un contrat
le permet.

Actions : créer, modifier, désactiver et supprimer selon les endpoints réels,
avec confirmation pour toute désactivation ou suppression. Une annonce active
doit afficher sa période et sa locale, pas seulement un badge de couleur.

### 6.2 Bibliothèque de contenu

`/admin/content` sépare la liste, l'éditeur et l'historique de versions. Les
filtres sont type (`LANDING`, `LEGAL`, `ANNOUNCEMENT`, `FAQ`, `MEDIA`) et
locale (`fr`, `en`). Le détail affiche le statut brouillon/publié, la version,
un aperçu contrôlé et les actions suivantes :

| Action | Contrat | Permission |
|---|---|---|
| créer un brouillon | `POST /admin/content` | `ADMIN` |
| enregistrer une version | `PATCH /admin/content/:id` | `ADMIN` |
| publier / dépublier | endpoints dédiés | `ADMIN` |
| consulter les versions | `GET .../versions` | admin autorisé |
| restaurer | `POST .../restore/:versionId` | `ADMIN` |
| consulter l'audit | `GET /admin/content/audit` | admin autorisé |

La publication affiche une confirmation résumant locale, type et version. Le
contenu libre n'est jamais traduit automatiquement et les médias doivent
référencer des URL HTTPS contrôlées.

## 7. `/admin/moderation` - signalements

La page est une file de dossiers, pas une simple table. Chaque dossier expose
priorité, type de signal, date, statut et utilisateur concerné selon les
champs autorisés. Le détail montre le contexte minimal nécessaire, les preuves
disponibles, la timeline et la décision.

Actions : ouvrir, traiter, ignorer ou ajouter une note lorsque le contrat le
permet. Toute mutation indique l'acteur et le résultat dans l'audit. Une
permission insuffisante affiche un écran `403` dédié sans révéler les données
du dossier.

## 8. `/admin/users` - utilisateurs

La liste comprend recherche, statut actif/inactif, rôle, date d'inscription,
points et volumes contractuels (tickets, sessions). Le détail montre l'identité
autorisée, l'activité pertinente, les signalements liés et l'historique admin,
sans exposer de secret.

L'action de suspension ou réactivation est disponible uniquement à un
administrateur autorisé, demande confirmation et décrit son impact. Le rôle ne
doit pas être modifiable depuis cet écran si aucun endpoint de changement de
rôle n'est explicitement prévu par le cahier des charges.

## 9. `/admin/audit` - journal de traçabilité

La timeline est filtrable par action, type d'objet, acteur et période lorsque
le contrat les supporte. Chaque événement affiche acteur, horodatage, action,
objet, résultat et lien de contexte. La pagination conserve les filtres.

Les états attendus sont : chargement, journal vide, erreur récupérable,
résultats et accès refusé. Les événements de publication, restauration,
modération, suspension, suppression et tirage doivent être retrouvables sans
exposer secret, graine ou contenu sensible.

## 10. États, responsive et accessibilité

### Breakpoints

- `1280 px` : sidebar complète, tableaux en colonnes, panneaux deux colonnes.
- `768 px` : sidebar compacte, panneaux réorganisés, tableaux avec priorité de
  colonnes et actions toujours visibles.
- `320 px` : navigation horizontale défilable, cartes empilées, lignes converties
  en cartes sémantiques, action primaire sticky ou placée immédiatement sous le
  titre.

À aucune largeur le contenu ne doit créer de défilement horizontal accidentel.
Les informations d'une ligne ne sont pas supprimées silencieusement : elles
sont regroupées sous des libellés « statut », « date », « action ».

Chaque écran implémente les variantes `loading`, `empty`, `success`, `error`,
`permission denied` et, lorsque pertinent, `disabled`. Les boutons possèdent
un nom accessible, un focus visible et un ordre clavier logique. Les dialogues
gèrent `Escape`, le focus initial et le retour au déclencheur. `prefers-reduced-motion`
supprime les animations non nécessaires.

## 11. Definition de design avant raccordement

Le spécialiste design admin considère le design prêt pour raccordement lorsque :

1. les sept routes admin de la matrice sont couvertes par une structure et des
   composants identifiés ;
2. chaque tableau possède ses colonnes desktop, sa représentation mobile et
   son action primaire ;
3. chaque mutation possède permission, précondition, confirmation et résultat ;
4. les états loading/empty/error/403 sont définis pour chaque domaine ;
5. aucun contenu de maquette n'est transposé comme donnée réelle sans contrat ;
6. les icônes, médias, tokens et focus suivent l'inventaire V3 ;
7. le raccordement fonctionnel et l'audit navigateur sont planifiés après ce
   gel, sur des commits séparés par domaine.

Cette spécification est une référence de conception. Elle ne constitue pas une
preuve de conformité visuelle ou fonctionnelle et ne permet pas de clôturer la
carte DASH-V3 à elle seule.
