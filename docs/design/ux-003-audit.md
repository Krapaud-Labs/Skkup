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

## Corrections fonctionnelles UX-003 en cours

- Le shell privé viewer rend désormais une navigation persistante unique et le menu compte.
- Le check-in quotidien appelle `POST /me/daily-checkin` et met à jour solde, série et carte débloquée.
- Les cartes à gratter appellent `POST /me/scratch-cards/:id/scratch`, affichent le gain ou le ticket et retirent la carte consommée.
- La création d’un sponsor recharge la collection complète afin de conserver `_count` et d’éviter un crash de rendu.
- Le changement de statut d’un signalement conserve la ligne enrichie et ne remplace plus `user` par une réponse partielle.
- L’administration expose maintenant un parcours de préparation et d’exécution d’un tirage avec graine exploitant, entropie publique, confirmation et retour d’empreinte.
- L’éditeur de contenu distingue désormais l’édition des titres, corps, questions FAQ et métadonnées média, avec états d’exécution et retour de publication.
- La pagination viewer affiche les erreurs des pages secondaires et permet une reprise ciblée sans recharger tout le dashboard.

Les validations de ces flux sont ajoutées aux tests ciblés avant la fusion. Les parcours secondaires, les états réseau admin et la gestion éditoriale restent ouverts jusqu’à preuve dédiée.
