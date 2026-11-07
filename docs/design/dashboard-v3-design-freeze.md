---
last_updated: 2026-10-29
owner: Mickael MUR
---

# DASH-V3 - Design freeze et matrice de réalisation

Statut : `design en cadrage`, non approuvé pour la recette finale.
Date : 4 octobre 2026

Ce document devient la référence de séquencement : le design est d'abord
figé écran par écran, puis les fonctionnalités sont raccordées aux contrats
réels et enfin auditées en une passe de recette complète. Il ne valide pas la
Definition of Done.

## Matrice viewer

| Référence | Route | Composition à figer avant implémentation | Contrat et états à raccorder |
| --- | --- | --- | --- |
| `dashboard-viewer-principal.png` | `/dashboard` | shell viewer, KPI points/série/tickets, stream mis en avant, extension, récompenses, tirages, activité | session, résumé viewer, streams, récompenses, tirages, historique; loading/empty/error |
| `viewer-streams-detaille.png` | `/dashboard/streams` | recherche, filtres plateformes, cartes médias, favoris, pagination, CTA extension | catalogue streams, favoris, pagination, erreur et catalogue vide |
| `viewer-tirages-detaille.png` | `/dashboard/tirages` | cartes lots, statut, dates et résultats; le coût/ticket et la participation de la maquette restent historiques, soumis aux décisions US-009 | tirages publics, dates, lots et résultat publié; aucun coût ni règle de ticket n'est affirmé tant que US-009 reste `needs-review` |
| `viewer-recompenses-detaille.png` | `/dashboard/recompenses` | filtres, cartes disponibles/utilisées, gain, progression et détail | récompenses, solde, consommation, double clic, erreur |
| `viewer-historique-detaille.png` | archive de conception, ancienne route `/dashboard/historique` | référence historique, écran viewer retiré; l’ancienne URL redirige vers l’activité du dashboard | activité récente du dashboard; API et données conservées, vue viewer complète retirée |
| `viewer-extension-detaille.png` | `/dashboard/extension` | installation, association, code, appareils, expiration et reprise | pairing token, appareils, révocation, session et erreurs |

## Matrice admin

| Référence | Route | Composition à figer avant implémentation | Contrat et états à raccorder |
| --- | --- | --- | --- |
| `dashboard-admin-principal.png` | `/admin` | contexte, KPI illustrés, tableaux tirages/lots, éditorial, modération, audit | résumé admin, permissions, loading/empty/error |
| `admin-tirage-detaille.png` | `/admin/raffles` | cockpit de tirage, lot, participants, éligibilité, contrôle, résultat, audit | CRUD/tirage cryptographique, autorisation, confirmation, erreur |
| `admin-lots-detaille.png` | `/admin/lots` | inventaire illustré, stock, fournisseur, édition et suppression protégée | lots, stock, validation, permissions et audit |
| `admin-annonces-contenus-detaille.png` | `/admin/announcements`, `/admin/content` | listes, édition, brouillon, publication, planification, archivage, versions | annonces/contenus, mutations, historique et erreurs |
| `admin-signalements-utilisateurs-detaille.png` | `/admin/moderation`, `/admin/users`, `/admin/audit` | dossiers, priorité, contexte, décision, suspension et timeline | signalements, utilisateurs, audit, 401/403 et mutations protégées |

## Règles de gel design

- Aucun écran secondaire ne sera considéré terminé parce que sa route existe.
- Les composants partagés doivent porter les mêmes tokens de couleur, densité,
  iconographie, focus et états responsive que les maquettes.
- Chaque zone visuelle doit avoir une source de données ou un état vide
  contractuel identifié. Aucun texte, compteur, média ou statut fictif.
- Les breakpoints de référence sont 320, 768 et 1280 px minimum.
- Le gel design sera déclaré seulement après relecture des 13 références,
  vérification des assets/icônes et accord du spécialiste design fidelity.
- La recette fonctionnelle et l'audit final commenceront après ce gel, sur la
  branche de travail dédiée et avec commits atomiques par domaine.

## État de la phase

- Inventaire des références et routes : effectué.
- Design system et assets : existants mais relecture de fidélité encore requise.
- Implémentation : partielle, ne pas déclarer le gel.
- Fonctionnalités réelles : partiellement raccordées, ne pas déclarer la recette.
- QA desktop/mobile : ouverte.
- PR et fusion `dev` : interdites jusqu'à la fin de la recette.

## Proposition ciblée : `/dashboard/tirages` Viewer — 2026-11-07

Statut : `proposition en revue`, non approuvée pour implémentation. Cette
proposition améliore la hiérarchie visuelle d'une route sans fermer le gate
global de conception.

### Hiérarchie et composition

- Conserver l'introduction de page, la recherche et les filtres par statut
  existants. Les compteurs des filtres restent calculés depuis la liste réelle.
- Conserver le master/detail : liste sélectionnable d'un côté, détail du tirage
  sélectionné de l'autre. Rendre la sélection plus visible et garder le titre,
  le statut et les informations utiles lisibles dans la liste.
- Dans chaque entrée de liste, hiérarchiser le statut, le titre, la date de
  tirage, une description courte et l'aperçu des premiers lots réels. Garder
  les quantités de lots et `ticketsDistribues` comme données factuelles; ne pas
  transformer ce dernier en nombre de participants ou en règle de participation.
- Dans le détail, présenter le statut et les dates, puis la description, la
  liste des lots et, quand elle existe, la valeur estimée et le fournisseur.
  Afficher les gagnants uniquement à partir du résultat publié fourni par
  `GET /raffles/:id/result`.
- Utiliser `imageUrl` pour les médias réels. Sans image, afficher un fallback
  neutre cohérent avec le lot; ne pas reprendre les photos ou noms de la
  référence comme contenu produit.

### Responsive et accessibilité

- À 320 px, empiler recherche, filtres, liste et détail sélectionné; aucun
  défilement horizontal de page. Garder le détail accessible après sélection.
- À 768 px, garder la composition empilée ou en panneau compact selon la largeur
  réellement disponible après le shell; ne pas imposer deux colonnes trop
  étroites.
- À 1280 px, utiliser une colonne de liste stable et un panneau de détail plus
  large. Le master/detail doit rester compréhensible au zoom 200 %.
- Garder les boutons natifs au clavier, un focus visible, des libellés explicites
  et une distinction de statut qui ne repose pas uniquement sur la couleur.
  Une mise à jour périodique du compte à rebours ne doit pas interrompre le
  lecteur d'écran à chaque minute.
- Préserver les états de chargement, liste vide, recherche sans résultat,
  erreur/réessai et résultat indisponible déjà prévus par le contrat et
  l'interface.

### Limites produit et décisions ouvertes

La référence détaillée contient des chiffres, catégories, participants,
badges promotionnels, nombre de tickets requis et promesses d'acquisition qui
ne sont pas garantis par les contrats. Aucun ne doit être ajouté sur cette base.
Le contrat `Tirage` expose le statut, titre, description, dates, lots, valeurs,
quantités, fournisseur, images éventuelles et total de tickets distribués.

Cette proposition ne redéfinit ni ne valide le parcours d'inscription déjà
présent dans l'interface. US-009 et FLOW-004 maintiennent l'acquisition, le
coût, l'éligibilité, la consommation et les limites en `needs-review`. Une
contradiction documentaire demeure entre cette inconnue et l'affirmation de
`docs/04-api-contract.md` selon laquelle les tickets V1 sont obtenus uniquement
par scratchcard. Aucune nouvelle règle ou présentation de règle ne doit être
déduite avant clarification owner.

La QA existante est principalement fonctionnelle avec API simulée; la preuve
responsive du 2026-10-07 et la capture détaillée sont historiques. Une
[baseline fraîche de `/dashboard/tirages`](../quality/evidence/dashboard-viewer-raffles-baseline-2026-11-07/README.md)
du checkout courant existe aux largeurs 320, 768 et 1280 avec des fixtures.
Elle ne remplace pas la recette complète des états, l'authentification/API
réelle, le clavier/focus, le contraste, le zoom, le lecteur d'écran ou
reduced-motion; ces preuves restent ouvertes après fermeture du gate.

### Amendement responsive issu de la baseline du 2026-11-07

- Conserver le master/detail et compacter les cartes de liste : contenu aligné
  en haut, moins d'espace inutilisé, statut/date/titre/lots groupés, sélection
  nettement visible. À 1280 px, conserver une liste stable et le panneau détail
  plus large.
- Construire chaque carte de liste en deux zones alignées en haut : média carré
  à largeur stable avec `object-fit: contain` pour éviter de couper les visuels
  de lots, et contenu flexible. Garder le fallback neutre dans la même boîte.
  Dans le contenu, afficher statut et
  date ensemble, puis titre, une description limitée à deux lignes et les
  métadonnées factuelles; tronquer les aperçus longs sans les laisser élargir
  la grille. Garder une hauteur déterminée par le contenu, sans `min-height`
  décoratif qui recrée le vide visible dans la baseline.
- Rendre la sélection identifiable par un contour accentué et un repère
  structurel persistant (par exemple une barre latérale), en complément du
  fond. Conserver `aria-pressed` sur le bouton et un focus clavier discernable;
  l'état ne doit pas dépendre de la seule couleur.
- À 768 px, garder la pile liste puis détail : la baseline montre que le shell
  partagé occupe déjà environ 333 px de hauteur avant `main`, et une seconde
  colonne réduirait davantage la largeur utile. Ne passer au master/detail côte
  à côte qu'à partir de 900 px de largeur de contenu disponible; sous ce seuil,
  afficher le détail après la liste sélectionnable, sans masquer cette dernière.
- À 320 px, présenter les champs de chaque lot sur plusieurs lignes lorsque
  nécessaire; garder le nom lisible et placer quantité, fournisseur et valeur
  sous le nom au lieu de les comprimer sur une ligne.
- Pour les lots du détail, conserver l'image ou son fallback dans une colonne
  stable et grouper les attributs textuels dans une colonne flexible. Sous
  400 px, empiler quantité, fournisseur et valeur sous le nom du lot; omettre
  les attributs absents plutôt que réserver des cases vides.
- À 320 et 768 px, la navigation partagée prend actuellement respectivement
  environ 517 px et 333 px avant le début de `main`; `document.scrollWidth` ne
  dépasse pas le viewport. La compacité du shell mobile affecte plusieurs
  routes et doit être décidée dans le design DASH-V3 partagé, pas dans cette
  proposition Tirages seule.
- Les captures utilisent un Viewer synthétique et des réponses API simulées;
  elles établissent uniquement le rendu frontend courant et les mesures DOM
  consignées dans le rapport de baseline. Aucun parcours backend, règle métier
  ou critère ACT-08 global n'est accepté par cet amendement.
