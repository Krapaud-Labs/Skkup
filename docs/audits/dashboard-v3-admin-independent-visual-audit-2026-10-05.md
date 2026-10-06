# Audit visuel indépendant admin DASH-V3

Date : 5 octobre 2026
Périmètre : `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`, `/admin/users`, `/admin/audit`
Références : `docs/design/skkup-dashboard-references/dashboard-admin-principal.png`, `ecrans-secondaires-admin.png`, `admin-tirage-detaille.png`, `admin-lots-detaille.png`, `admin-annonces-contenus-detaille.png`, `admin-signalements-utilisateurs-detaille.png` et `docs/design/dashboard-v3-admin-spec.md`.

## Méthode et limites

Audit réalisé en lecture seule à partir des PNG, des composants réellement utilisés par les routes et des styles présents dans le worktree. Aucun fichier de code n’a été modifié. Le worktree contenait déjà des modifications non liées dans `.workspace.toml` et `frontend/src/components/admin/RafflesAdminV3.tsx`, laissées intactes.

Le rendu navigateur authentifié n’a pas pu être capturé pendant cette passe. Le CLI BrowserAct est installé, mais son journal système est inaccessible dans l’environnement courant. Les constats de structure et de composition ci-dessous sont donc prouvés par le code et les maquettes. Ils ne constituent pas une validation pixel-perfect live.

## Verdict

**Non conforme pour livraison.** La navigation et les principaux appels API sont présents, mais aucune des huit routes ne peut encore être déclarée conforme écran par écran aux maquettes. Les états vides honnêtes sont corrects du point de vue anti-fausse donnée, mais ils ne prouvent pas le rendu cible avec les données contractuelles.

## Synthèse des priorités

| Route | P0 ouverts | P1 ouverts | Conclusion |
| --- | ---: | ---: | --- |
| `/admin` | 2 | 3 | Composition cockpit trop simplifiée |
| `/admin/raffles` | 1 | 3 | Détail enrichi mais encore moins dense que la référence |
| `/admin/lots` | 1 | 3 | Drawer présent, inventaire incomplet visuellement |
| `/admin/announcements` | 1 | 4 | Éditeur sans la richesse de la maquette |
| `/admin/content` | 1 | 3 | Écran réel non équivalent à la bibliothèque maquette |
| `/admin/moderation` | 1 | 4 | File de dossiers trop réduite, preuves absentes visuellement |
| `/admin/users` | 1 | 3 | Fiche master-detail partielle |
| `/admin/audit` | 1 | 3 | Journal sans timeline et pagination de référence |

## Constats P0 par écran

### `/admin` cockpit principal

1. **Composition opérationnelle incomplète.** La maquette montre quatre KPI illustrés, deux tableaux denses, un bloc éditorial, un bloc de signalements et une timeline d’audit. Le code ne rend dans les tableaux que des résumés très courts. Le bloc éditorial ne présente que deux lignes agrégées et la sécurité seulement deux compteurs, sans les lignes opérationnelles attendues. Preuve : `frontend/src/app/admin/page.tsx:38-43`.

2. **État de données vide non équivalent à la cible visuelle.** Quand les collections sont vides, les panneaux deviennent des messages seuls. C’est honnête, mais il n’y a pas d’état vide priorisé avec action métier contractuelle, ni de structure de remplacement permettant de vérifier la grille et la densité du PNG. Preuve : `frontend/src/app/admin/page.tsx:36-43`.

### `/admin/raffles`

1. **Le détail n’atteint pas la composition de `admin-tirage-detaille.png`.** Le composant contient une fiche lot, des KPI, règles, préparation et historique, mais il manque la composition complète du panneau de contrôle de droite, les états visuels de préconditions, l’illustration et les actions secondaires de l’en-tête telles que présentées dans la maquette. Preuve : `frontend/src/components/admin/RafflesAdminV3.tsx:185-471`.

### `/admin/lots`

1. **Inventaire visuellement incomplet par rapport à `admin-lots-detaille.png`.** La table ne rend pas toutes les colonnes de la maquette, notamment le type, disponibilité détaillée, statut de publication, tirage lié, dernière mise à jour et menu d’actions. Le drawer contient les champs de base mais pas les onglets Informations/Aperçu, la prévisualisation média et le résumé d’erreurs de la référence. Preuve : `frontend/src/components/admin/LotsAdminV3.tsx:185-365`.

### `/admin/announcements`

1. **La bibliothèque et l’éditeur ne reproduisent pas `admin-annonces-contenus-detaille.png`.** Le code ne rend ni onglets Toutes/Brouillons/Planifiées/Publiées/Archivées, ni type, locale, version, auteur, image, aperçu et actions de publication détaillées. L’éditeur est un formulaire titre/message/périodes avec historique simple. Preuve : `frontend/src/components/admin/AnnouncementsAdminV3.tsx:31-34`.

### `/admin/content`

1. **Le parcours contenu n’est pas prouvé comme équivalent à la maquette.** La route délègue à `GestionContenu`, tandis que la maquette demande une bibliothèque séparée de l’éditeur et de l’historique, des filtres type/locale, un aperçu contrôlé et les actions de version/publication/restauration. Le point d’entrée est `frontend/src/components/admin/AdminSectionPage.tsx:105`; la preuve d’une composition complète comparable au PNG manque.

### `/admin/moderation`

1. **La file de modération est structurellement trop réduite.** Le code affiche une liste de boutons et un panneau de détail textuel. La maquette exige onglets Signalements/Utilisateurs, KPI, filtres multiples, table dense, preuves média, chronologie, contexte utilisateur et actions de sanction. Les preuves média, les KPI, les onglets et la pagination ne sont pas rendus. Preuve : `frontend/src/components/admin/AdminSectionPage.tsx:103`.

### `/admin/users`

1. **La fiche utilisateur ne couvre pas le panneau métier de référence.** Le master-detail comporte rôle, statut, points et deux compteurs, mais pas les onglets réellement interactifs, l’activité détaillée, les signalements liés, l’historique admin et les éléments de contexte prévus par la spécification. Preuve : `frontend/src/components/admin/UsersAdminV3.tsx:21`.

### `/admin/audit`

1. **Le journal n’a pas la timeline opérationnelle de la maquette.** Le code rend une liste sélectionnable avec métadonnées JSON dans un `<pre>`. La référence demande une timeline lisible avec acteur, heure, objet, résultat, contexte et pagination persistante. Il manque aussi les filtres acteur/période lorsque le contrat les supporte. Preuve : `frontend/src/components/admin/AuditAdminV3.tsx:16`.

## Constats P1 transverses

1. **Shell non homogène avec les PNG.** Le cockpit utilise une barre de contexte spécifique, tandis que les routes secondaires passent par `Shell` avec un bouton « Retour au cockpit » et un en-tête distinct. La maquette utilise un shell admin unifié avec contexte, navigation, compte et actions cohérents. Preuve : `frontend/src/app/admin/page.tsx:31-35` et `frontend/src/components/admin/AdminSectionPage.tsx:21-29`.

2. **Iconographie et assets non équivalents partout.** Certains KPI utilisent des PNG générés, tandis que les titres de panneaux utilisent encore des icônes génériques ou n’en ont pas. Les PNG de référence utilisent des pictogrammes métiers dédiés et une hiérarchie visuelle constante. Preuve : `frontend/src/app/admin/page.tsx:38-43` et `frontend/src/components/admin/UsersAdminV3.tsx:21`.

3. **Densité responsive non démontrée.** Les règles CSS prévoient des adaptations, mais aucune capture authentifiée aux largeurs 1280, 768 et 320 ne prouve la transformation des tableaux, drawers, filtres et actions en cartes lisibles. La présence d’une règle CSS ne valide pas le rendu.

4. **États interactifs incomplets ou non vérifiés.** Les actions de création, modification, archivage, traitement, suspension et audit existent partiellement, mais leurs confirmations, erreurs de permission, succès, chargements et retours visuels ne sont pas comparés aux maquettes ni validés en parcours navigateur.

## Éléments conformes constatés

- Les huit routes admin existent et délèguent à des composants distincts.
- Les états vides évitent les fausses données et les fausses images.
- Le drawer lots est désormais présent avec fermeture par bouton, clic extérieur et Échap selon le commit agent signalé.
- Les données des lots et tirages utilisent les URLs média du contrat lorsqu’elles existent.
- Les utilisateurs disposent d’un master-detail et d’un contrôle de statut.
- Le journal d’audit expose l’événement sélectionné et ses métadonnées contractuelles.

Ces points ne lèvent pas les P0, car ils ne prouvent pas la fidélité visuelle complète ni les parcours responsive.

## Definition of Done restante avant 100%

1. Recomposer le cockpit principal pour reprendre la hiérarchie et la densité exactes du PNG, avec états réels et états vides explicitement conçus.
2. Terminer chaque écran secondaire avec sa structure dédiée, ses médias contractuels, ses filtres, ses actions et son panneau de détail.
3. Harmoniser le shell, les logos, les pictogrammes, les tokens, les espacements et les états de statut sur les huit routes.
4. Ajouter ou confirmer les capacités API manquantes sans inventer de données : aperçus média, versions, preuves, pagination, contexte et historique.
5. Tester les parcours réels de mutation et d’erreur, notamment permissions, confirmations, archivage, suppression protégée, préparation de tirage et traitement de signalement.
6. Capturer chaque route à 1280, 768 et 320 px avec une session admin réelle, puis conserver une checklist de comparaison avec le PNG correspondant.
7. Faire relire ces captures par un QA indépendant et ne publier ni merger tant qu’un P0 ou une preuve de conformité manque.

## Conclusion indépendante

Le statut correct est **audit ouvert, non conforme, aucun feu vert de livraison**. Les tests de build, TypeScript, lint et composants peuvent rester verts tout en laissant les écarts visuels ci-dessus. Aucun agent unique ne doit valider la Definition of Done.
