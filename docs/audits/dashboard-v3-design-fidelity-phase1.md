# DASH-V3 - Audit de fidélité design, phase 1

Date : 4 octobre 2026
Spécialité : design fidelity
Périmètre : comparaison des 13 références de `docs/design/skkup-dashboard-references/` avec le code actuel, guidée par `docs/design/dashboard-v3-design-freeze.md`.

## Conclusion

La conformité écran par écran n'est pas démontrée. Le code possède une base de
shells, de panneaux sombres, de tokens et d'états contractuels, mais la
composition actuelle reste une adaptation fonctionnelle et beaucoup moins
dense que les références. Les références détaillées montrent notamment des
grilles multi-colonnes, des médias, des tables, des panneaux de détail et des
barres d'outils qui ne sont pas tous représentés par les composants actuels.

Le gel design ne doit donc pas être déclaré. Cet audit est un état des lieux,
pas une validation de la Definition of Done.

## Méthode et preuves

- Les 13 PNG ont été relus individuellement. Les références détaillées sont
  en 1536×1024, les deux dashboards principaux en 1586×992, et les deux
  planches de synthèse en 1900×828 et 1536×1024.
- Le freeze a été confronté aux routes et composants présents sous
  `frontend/src/app` et `frontend/src/components`.
- L'analyse porte sur la structure visuelle attendue, la densité, la
  hiérarchie, les états et les points de raccord identifiés par le freeze.
- Aucun fichier de production n'a été modifié pendant cette phase.

## Matrice de fidélité

Légende : `partiel` signifie que la route ou une structure équivalente existe,
mais que la composition de la maquette n'est pas reproduite ; `non prouvé`
signifie qu'aucune preuve de comparaison rendue écran par écran n'existe.

| Référence / route | Composition attendue | Constat dans le code actuel | Écart design prioritaire | Verdict |
|---|---|---|---|---|
| `dashboard-viewer-principal.png` / `/dashboard` | Shell à navigation latérale, trois KPI illustrés, stream mis en avant avec média et minuteur, extension en panneau latéral, cartes à gratter, tirages et activité | `TableauDeBord` raccorde profil, historique, cartes, tickets, annonces et streams réels. Les styles V3 fournissent hero, KPI, feature, extension et grilles, mais la structure est plus générique et ne prouve pas les médias, la densité ni les panneaux de la référence | Recomposer le dashboard autour de la grille de la maquette, avec zones média et états contractuels équivalents sans inventer de contenu | Partiel, non prouvé |
| `viewer-streams-detaille.png` / `/dashboard/streams` | Recherche en barre supérieure, filtres plateformes/catégories/langues/tri, bandeau extension, grille de cartes média 4 colonnes, favoris et pagination | `ListeStreams` fournit recherche, filtre plateforme, favoris localement, cartes textuelles, lien externe et pagination. Il n'y a pas de média de carte, ni filtres catégorie/langue/tri, ni composition 4 colonnes/bandeau de la référence | Refaire le toolbar et la carte streamer avec les zones média, badges, CTA et densité responsive définis par la maquette ; conserver l'état vide réel | Partiel, écart élevé |
| `viewer-tirages-detaille.png` / `/dashboard/tirages` | Trois onglets de statut, recherche/filtres, grille de lots, détail latéral du tirage sélectionné, participation et message de manque de tickets | `ListeTirages` raccorde la liste et l'inscription/résultat, mais la référence attend un détail latéral riche, des cartes illustrées, compteurs participants/tickets et onglets structurés | Ajouter une composition master/detail et les états visuels statut/participation, alimentés uniquement par le contrat | Partiel, écart élevé |
| `viewer-recompenses-detaille.png` / `/dashboard/recompenses` | En-tête avec solde, panneau explicatif, onglets comptés, recherche/tri, grille de cartes illustrées et panneau de détail | `CentreRecompenses` couvre le chargement, filtres et consommation contractuelle, mais la présence de la grille illustrative, du panneau de détail et de la hiérarchie de la référence n'est pas démontrée | Reproduire la grille, les badges disponibles/verrouillées/utilisées, la progression et le détail sans remplacer les données API par des fixtures | Partiel, non prouvé |
| `viewer-historique-detaille.png` / `/dashboard/historique` | Filtres par type, plateforme et période, KPI période, table dense, panneau de détail transaction et export | `HistoriquePointsViewer` fournit historique et pagination/états. Le code actuel ne démontre pas le layout table + panneau latéral, les KPI période, le filtre période ni l'export de la référence | Recomposer en table/panneau détail avec données de l'historique réel et état vide contractuel | Partiel, écart élevé |
| `viewer-extension-detaille.png` / `/dashboard/extension` | En-tête pédagogique, navigateurs compatibles, état de connexion, parcours en trois étapes, code expirant, appareils et confidentialité | `CodeAppariement` et les composants d'extension gèrent appariement, expiration, appareils et révocation réels. La composition multi-panneaux, les logos navigateurs et la zone confidentialité ne sont pas démontrés à l'identique | Aligner la composition et les étapes sur la référence, en conservant les états réel/neutral/error | Partiel, non prouvé |
| `dashboard-admin-principal.png` / `/admin` | Barre de contexte, quatre KPI illustrés, tables tirages/lots, annonces/contenus, signalements et journal d'audit | `page.tsx` charge le résumé admin et affiche un cockpit avec navigation et cartes/styles V3. La référence exige plusieurs tables simultanées et un journal ; la couverture actuelle est plus abstraite et l'état vide réel réduit fortement la densité | Construire la grille admin multi-table avec colonnes, actions et états vides contractuels ; ne pas afficher les valeurs de la maquette quand l'API ne les fournit pas | Partiel, écart élevé |
| `admin-tirage-detaille.png` / `/admin/raffles` | Fil d'Ariane, fiche lot illustrée, période, KPI participants, règles, obligation extension, progression de préparation, alertes et audit | `AdminSectionPage` et le domaine raffle exposent des données et actions administratives réelles. La composition cockpit détaillée et la colonne de progression/alertes n'est pas suffisamment établie par le code inspecté | Découper la page en fiche, règles, progression et audit, avec confirmation et permissions visibles | Partiel, non prouvé |
| `admin-lots-detaille.png` / `/admin/lots` | KPI stock, recherche/filtres, table inventaire illustrée, panneau de création/édition, aperçu, validation et toast | La route réutilise `AdminSectionPage`; les contrats/actions existent, mais la présence du tableau illustré, du drawer d'édition, de l'aperçu et des validations visuelles n'est pas démontrée | Implémenter la composition table + drawer responsive et les états de validation réels | Partiel, écart élevé |
| `admin-annonces-contenus-detaille.png` / `/admin/announcements`, `/admin/content` | Onglets de statut, table sélectionnable, éditeur latéral, versions, historique, publication/planification/archivage | `AdminSectionPage`/`GestionContenu` raccordent la gestion de contenu, mais l'éditeur latéral riche, l'aperçu image, les versions et la barre d'actions de la référence ne sont pas prouvés écran par écran | Reconstituer la zone liste + panneau d'édition et les transitions de statut contractuelles | Partiel, écart élevé |
| `admin-signalements-utilisateurs-detaille.png` / `/admin/moderation`, `/admin/users`, `/admin/audit` | Onglets signalements/utilisateurs, KPI, filtres, table, dossier latéral avec preuves, timeline, contexte utilisateur et actions protégées | Les trois routes existent et les contrats de modération/utilisateurs/audit ont été enrichis. La composition de dossier latéral avec preuves, timeline et contexte reste à démontrer visuellement | Unifier les écrans en master/detail, afficher 401/403 et mutations protégées dans les états prévus | Partiel, non prouvé |
| `ecrans-secondaires-viewer.png` / synthèse viewer | Quatre écrans cohérents avec shell, densité mobile/desktop, cartes et navigation partagées | Les routes viewer existent et partagent des primitives, mais leurs compositions sont hétérogènes et plus légères que la planche de synthèse | Harmoniser shell, en-tête, filtres, cards et états entre les quatre parcours | Partiel |
| `ecrans-secondaires-admin.png` / synthèse admin | Quatre écrans admin cohérents : tirage, lots, annonces, signalements, avec navigation et panneaux secondaires | Les routes existent mais reposent en grande partie sur des composants génériques ; la cohérence master/detail et la densité de la planche ne sont pas prouvées | Définir un shell secondaire unique et des layouts dédiés par domaine avant recette | Partiel |

## Constats transverses

### Points déjà présents

- Les routes viewer et admin prévues par le freeze existent.
- Les composants chargent majoritairement des contrats backend et prévoient des
  états de chargement, vide ou erreur ; cela respecte la contrainte anti-fictif
  mais ne suffit pas à prouver la fidélité visuelle.
- Les tokens sombres, bordures, accents violets/bleus et plusieurs layouts
  responsive existent dans `frontend/src/app/globals.css`.
- Les primitives `SkkupIcon`, cartes, boutons, navigations et panneaux offrent
  une base commune exploitable.

### Écarts récurrents

1. Les références détaillées ont une densité de cockpit et une hiérarchie
   master/detail que les composants génériques actuels ne reproduisent pas.
2. Les médias, avatars, logos de plateformes, badges et illustrations de lots
   sont structurants dans les maquettes ; leur absence ou leur remplacement
   par des blocs textuels modifie fortement la composition.
3. Les filtres, tabs, compteurs, tables et panneaux latéraux ne sont pas
   uniformes entre les routes.
4. Les dimensions 320/768/1280 sont mentionnées dans le freeze, mais aucune
   preuve visuelle rendue et comparée pour chacune des 13 références n'est
   incluse dans ce périmètre.
5. Les données d'exemple visibles dans les PNG ne doivent pas être copiées
   comme contenu produit. Lorsque les contrats sont vides, la réalisation
   devra conserver une composition fidèle avec un état vide honnête.

## Décision de phase

Statut : `design fidelity phase 1 - écart confirmé`.
Le design n'est pas gelé. La prochaine passe design doit prioriser les layouts
master/detail et les composants de densité (media card, data table, drawer,
filters, tabs, KPI et timeline), puis produire les rendus de comparaison avant
le raccordement final et l'audit fonctionnel.

Ce rapport est documentaire uniquement. Il ne modifie pas le code produit et
ne remplace pas l'accord du spécialiste design fidelity requis par le freeze.
