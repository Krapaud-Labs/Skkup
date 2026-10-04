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
| `dashboard-viewer-principal.png` / `/dashboard` | Shell à navigation latérale, trois KPI illustrés, stream mis en avant avec média et minuteur, extension en panneau latéral, cartes à gratter, tirages et activité | `TableauDeBord` raccorde profil, historique, cartes, tickets, annonces et streams réels. La grille V3 fournit KPI, feature, extension, récompenses et activité ; l'état vide stream est maintenant une zone structurée avec icône et CTA vers le catalogue réel, confirmée dans Chrome | Les médias, minuteur et densité des cartes restent dépendants de données contractuelles absentes du compte QA ; comparaison non vide et activité détaillée restent à prouver | Partiel, écart moyen |
| `viewer-streams-detaille.png` / `/dashboard/streams` | Recherche en barre supérieure, filtres plateformes/catégories/langues/tri, bandeau extension, grille de cartes média 4 colonnes, favoris et pagination | `ListeStreams` fournit recherche, filtre plateforme, favoris localement, cartes textuelles, lien externe et pagination. La carte utilise désormais une zone média V3 et un badge plateforme réel ; l'état vide conserve maintenant le bandeau, le titre, la barre de filtres fonctionnelle et un CTA vers l'extension | Les filtres catégorie/langue, les médias riches et la comparaison avec un catalogue non vide restent hors contrat ou non prouvés | Partiel, écart moyen |
| `viewer-tirages-detaille.png` / `/dashboard/tirages` | Trois onglets de statut, recherche/filtres, grille de lots, détail latéral du tirage sélectionné, participation et message de manque de tickets | `ListeTirages` fournit recherche titre/description, onglets de statut, master/detail, participation et résultat réel ; le détail dispose d’une zone iconographique V3. L’état vide conserve maintenant recherche, onglets à compteurs et lien vers le règlement, confirmés dans Chrome | Les médias riches, filtres catégorie et comparaison avec des tirages non vides restent absents du contrat ou non prouvés | Partiel, écart moyen |
| `viewer-recompenses-detaille.png` / `/dashboard/recompenses` | En-tête avec solde, panneau explicatif, onglets comptés, recherche/tri, grille de cartes illustrées et panneau de détail | `CentreRecompenses` couvre le chargement, filtres, tri et consommation contractuelle. La composition rend maintenant collection, solde, repère pédagogique et détail avec une grille stable même lorsque le contrat est vide ; capture Chrome confirmée | Les illustrations riches et les états verrouillés/progression de la maquette restent dépendants de champs absents du contrat actuel | Partiel, écart moyen |
| `viewer-historique-detaille.png` / `/dashboard/historique` | Filtres par type, plateforme et période, KPI période, table dense, panneau de détail transaction et export | `HistoriquePointsViewer` fournit filtres type/période, KPI, export CSV, table master/detail, sélection et pagination réelle. Les styles rendent maintenant le panneau de détail et la sélection de ligne ; la capture Chrome confirme un état vide honnête et lisible | Le filtre plateforme, les colonnes métier enrichies et la capture d'un historique non vide restent à couvrir par le contrat et les fixtures QA autorisées | Partiel, écart moyen |
| `viewer-extension-detaille.png` / `/dashboard/extension` | En-tête pédagogique, navigateurs compatibles, état de connexion, parcours en trois étapes, code expirant, appareils et confidentialité | La route rend maintenant une grille multi-panneaux avec bénéfices, navigateurs, état, étapes, plateformes et confidentialité. `CodeAppariement` conserve l'appariement, l'expiration, les appareils et la révocation réels. La capture Chrome confirme la hiérarchie et l'absence de débordement sur le viewport desktop | Les logos officiels et la capture mobile écran par écran restent à produire ; les liens d'installation restent limités à la route produit tant qu'aucun store réel n'est configuré | Partiel, écart moyen |
| `dashboard-admin-principal.png` / `/admin` | Barre de contexte, quatre KPI illustrés, tables tirages/lots, annonces/contenus, signalements et journal d'audit | `page.tsx` charge le résumé admin et affiche un cockpit avec navigation et cartes/styles V3. La référence exige plusieurs tables simultanées et un journal ; la couverture actuelle est plus abstraite et l'état vide réel réduit fortement la densité | Construire la grille admin multi-table avec colonnes, actions et états vides contractuels ; ne pas afficher les valeurs de la maquette quand l'API ne les fournit pas | Partiel, écart élevé |
| `admin-tirage-detaille.png` / `/admin/raffles` | Fil d'Ariane, fiche lot illustrée, période, KPI participants, règles, obligation extension, progression de préparation, alertes et audit | `AdminSectionPage` et le domaine raffle exposent des données et actions administratives réelles. La composition cockpit détaillée et la colonne de progression/alertes n'est pas suffisamment établie par le code inspecté | Découper la page en fiche, règles, progression et audit, avec confirmation et permissions visibles | Partiel, non prouvé |
| `admin-lots-detaille.png` / `/admin/lots` | KPI stock, recherche/filtres, table inventaire illustrée, panneau de création/édition, aperçu, validation et toast | La route réutilise `AdminSectionPage`; les contrats/actions existent, mais la présence du tableau illustré, du drawer d'édition, de l'aperçu et des validations visuelles n'est pas démontrée | Implémenter la composition table + drawer responsive et les états de validation réels | Partiel, écart élevé |
| `admin-annonces-contenus-detaille.png` / `/admin/announcements`, `/admin/content` | Onglets de statut, table sélectionnable, éditeur latéral, versions, historique, publication/planification/archivage | `AdminSectionPage`/`GestionContenu` raccordent la gestion de contenu, mais l'éditeur latéral riche, l'aperçu image, les versions et la barre d'actions de la référence ne sont pas prouvés écran par écran | Reconstituer la zone liste + panneau d'édition et les transitions de statut contractuelles | Partiel, écart élevé |
| `admin-signalements-utilisateurs-detaille.png` / `/admin/moderation`, `/admin/users`, `/admin/audit` | Onglets signalements/utilisateurs, KPI, filtres, table, dossier latéral avec preuves, timeline, contexte utilisateur et actions protégées | Les trois routes existent, les contrats sont raccordés et la primitive `skuup-premium-panel` restitue maintenant le master/detail et les états vides dans Chrome | Compléter la comparaison avec des dossiers réels non destructifs et vérifier les états 401/403 | Partiel, écart moyen |
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
