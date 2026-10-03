# UX-003 - Audit initial des dashboards

## Périmètre audité

L’audit couvre le dashboard viewer (`TableauDeBord`, `NavigationDashboard`, `MenuCompteDashboard`) et le back-office (`app/admin/page.tsx`, `AdminSas`, `NavigationAdmin`, `GestionContenu`), ainsi que leurs tests et appels API.

## Inventaire fonctionnel

### Viewer

- Vue d’ensemble : profil, série de visites et solde de points.
- Activité : historique paginé des points et tickets de tirage.
- Tirages : loterie ouverte, inscription et pagination des tickets.
- Contenus : annonces avec ouverture d’un dialogue détaillé, cartes à gratter et navigation vers les sections.
- Compte : langue, mot de passe, déconnexion et accès admin selon le rôle.

### Administration

- Cockpit : KPI signalements, tirages, annonces et streams partenaires.
- Modération : création de sponsors, liste des signalements et changement de statut.
- Contenu : création/édition/publication, FAQ, médias, versions, restauration et audit.
- Annonces : création, édition, archivage, historique et restauration.
- Tirages : création, édition des lots, historique et pagination.
- Streams : activation du partenariat et bonus horaire.

## Écarts prioritaires

1. Les deux shells exposent des navigation parallèles et plusieurs ancres locales. UX-003 doit définir une architecture unique et une hiérarchie de navigation non redondante.
2. Les KPI du cockpit résument des données déjà présentes plus bas sans lien direct vers l’action correspondante. Chaque KPI doit devenir un point d’entrée fonctionnel ou être supprimé.
3. Plusieurs actions sont regroupées dans des listes denses sans contexte de priorité, statut d’opération ni retour uniforme. Le nouveau système doit normaliser confirmation, succès, erreur et annulation.
4. Le gestionnaire de contenu édite des blocs via plusieurs boutons de prévisualisation, mais la carte ne présente pas encore une vue claire de publication, validation et impact. Le flux doit être traité comme une fonctionnalité complète.
5. Les sections viewer et admin mélangent navigation, résumé et détail. Les données doivent être affichées une seule fois au niveau le plus utile, avec des liens vers le détail lorsque nécessaire.
6. Les ancres et liens existants doivent être vérifiés route par route et interaction par interaction. Aucun élément de prototype ne sera conservé sans comportement réel.

## Règles de décision UX-003

- Une donnée possède une source de vérité et un emplacement principal.
- Un résumé doit mener vers l’action ou le détail qu’il représente.
- Toute action doit exposer ses états succès, chargement, vide, erreur et permission.
- Tout lien, bouton, onglet ou filtre doit être testé sur le parcours réel.
- Une fonctionnalité qui ne peut pas être rendue complète est supprimée ou scindée en work item explicite.

## Checkpoint suivant

Produire l’architecture cible et un prototype comparatif viewer/admin avant de modifier les composants de production.
