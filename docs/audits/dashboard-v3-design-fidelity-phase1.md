# DASH-V3 - Audit design fidelity, phase 1

Date : 2026-10-04  
Références auditées : les 13 fichiers de `docs/design/skkup-dashboard-references/`  
Référence de séquencement : `docs/design/dashboard-v3-design-freeze.md`  
Périmètre : comparaison visuelle statique des compositions attendues avec les routes et composants présents dans `frontend/src`. Aucun code produit n'a été modifié.

## Légende et méthode

- **P0** : composition absente ou structure qui empêche de reproduire l'écran de référence.
- **P1** : zone principale présente mais trop différente, incomplète ou non mesurablement fidèle.
- **P2** : finition, densité, iconographie, états ou responsive à aligner après les écarts P0/P1.
- Les mesures sont des cibles de recette à 1280 px minimum, avec contrôles complémentaires à 768 px et 320 px. Les proportions sont exprimées par rapport à la largeur utile hors navigation.
- Un compteur, média, libellé, statut ou avatar ne doit être affiché que s'il provient d'un contrat réel. Les données fictives visibles dans les maquettes sont des exemples de composition, pas des valeurs à recopier.

## Synthèse

| Niveau | Nombre | Conclusion |
|---|---:|---|
| P0 | 7 | Plusieurs panneaux détaillés de référence ne sont pas représentés par le code actuel, notamment les vues de détail admin et le panneau latéral viewer. |
| P1 | 19 | Les shells et principales listes existent, mais leur densité, leur hiérarchie, leurs médias et leurs actions ne correspondent pas encore à la composition cible. |
| P2 | 22 | Iconographie, tokens, badges, états et responsive nécessitent une passe dédiée après les corrections structurelles. |

Le gel design ne peut pas être déclaré : le document de gel lui-même indique que l'implémentation est partielle et que la relecture de fidélité reste ouverte.

## Matrice écran par écran

### 1. `dashboard-viewer-principal.png` → `/dashboard`

Code observé : `TableauDeBord.tsx`, dans `skuup-viewer-v3-content`.

- **P1 - composition principale** : la maquette répartit l'écran en trois KPI horizontaux, une zone stream mise en avant occupant environ 70 % de la largeur, une carte extension à droite d'environ 30 %, puis deux zones récompenses/tirages et une activité sur toute la largeur. Le code possède ces intentions (`skuup-viewer-v3-kpis`, `skuup-viewer-v3-main-grid`, `skuup-viewer-v3-rewards-grid`), mais l'état vide remplace le média, la jauge de visionnage et les cartes illustrées par un paragraphe. Cible : conserver les emplacements, hauteurs et alignements même quand les contrats renvoient zéro élément, avec un empty state dans le panneau concerné.
- **P1 - shell** : la maquette contient une sidebar persistante d'environ 17 % de la largeur, un header compact avec notifications/profil, et un contenu à 83 %. Vérifier que le layout effectif ne réintroduit pas l'ancien header vitrine ni une navigation empilée.
- **P2 - KPI** : chaque KPI doit conserver icône dédiée à gauche, valeur dominante 28-34 px, libellé et chevron à droite. Les cartes doivent rester en trois colonnes à 1280 px, deux puis une à 768/320 px.
- **P2 - états** : chargement, erreur et vide doivent utiliser la même surface, bordure et padding que le panneau nominal, sans modifier la hauteur globale de façon brutale.

### 2. `viewer-streams-detaille.png` → `/dashboard/streams`

Code observé : `ListeStreams.tsx`, page route et `CodeAppariement`.

- **P1 - header et extension** : la référence exige un header de recherche intégré, une introduction pleine largeur, puis une bannière extension avec statut, CTA et indicateur de connexion. La page actuelle rend `LocalizedPageIntro`, la liste puis le bloc extension en dessous : la bannière n'est pas au même niveau ni dans la même composition.
- **P1 - catalogue** : la cible est une grille de quatre cartes à 1280 px, deux lignes, médias en ratio proche de 16:9, badges live, plateforme, viewer count, avatar, tags, points/minute, CTA et favori. Le code utilise une grille `lg:grid-cols-3` et ne rend pas d'image média contractuelle dans la carte. Cible : 4 colonnes desktop, 2 tablette, 1 mobile ; média avec ratio 16/9 et zone de métadonnées stable.
- **P2 - contrôles** : les onglets plateformes et les trois filtres (catégorie, langue, popularité) doivent être distincts de la recherche ; le code ne possède qu'une recherche et un select plateforme.
- **P2 - pagination** : conserver le compteur, la pagination centrée et le sélecteur de taille à droite comme dans la maquette, avec état vide aligné sur la grille.

### 3. `viewer-tirages-detaille.png` → `/dashboard/tirages`

Code observé : `ListeTirages.tsx` et page route.

- **P0 - panneau de détail** : la référence a une grille de cartes à gauche et un panneau latéral de détail sélectionné à droite, avec onglets détails/règles/contenu, participation et erreur de tickets. La route actuelle rend une liste sans preuve d'un panneau de détail persistant.
- **P1 - carte tirage** : cible 3 colonnes desktop, image en tête, badge statut, compte à rebours, participants, tickets requis, date et CTA. Vérifier les ratios, la hauteur identique des cartes et l'état participation enregistrée.
- **P1 - filtres** : onglets ouverts/à venir/terminés et recherche, catégorie, statut doivent être visibles simultanément ; ils ne doivent pas être fusionnés dans un contrôle générique.
- **P2 - contexte** : le bandeau pédagogique tickets doit être positionné dans le header à droite et la sidebar doit afficher le solde de tickets.

### 4. `viewer-recompenses-detaille.png` → `/dashboard/recompenses`

Code observé : `CentreRecompenses.tsx` et page route.

- **P0 - composition master/detail** : la maquette exige une grille de récompenses à gauche et un panneau de détail fixe à droite, avec solde, explication, coût, solde restant, CTA, aperçu des gains et lien historique. Le code actuel expose surtout une grille/filtres et ne prouve pas cette colonne de détail persistante.
- **P1 - cartes** : cible trois colonnes, image/illustration dominante en tête, badge disponible/verrouillée/utilisée, progression et CTA selon l'état. Les cartes doivent garder une hauteur constante et une zone d'état en bas.
- **P1 - header** : titre avec icône cadeau, texte explicatif et carte de solde en haut à droite ; les filtres et recherche sont sous ce bloc, pas dans un header générique.
- **P2 - états** : les compteurs d'onglets doivent provenir des données et rester visibles même à zéro ; l'état "bientôt disponible" doit être une carte de grille, pas un message hors composition.

### 5. `viewer-historique-detaille.png` → `/dashboard/historique`

Code observé : `HistoriquePointsViewer.tsx` et page route.

- **P0 - détail latéral** : la référence exige une table de transactions à gauche et un panneau "Détail de la transaction" à droite, sélectionné et accessible. La présence d'une simple liste paginée ne suffit pas.
- **P1 - métriques** : deux cartes KPI (points gagnés, temps de visionnage) avec mini-graphique doivent précéder la table ; leur absence ou remplacement par du texte est un écart majeur.
- **P1 - table** : colonnes minimales plateforme, type, description, durée, points, éléments, date/heure, statut ; la table doit avoir une ligne active et une pagination complète.
- **P2 - filtres** : onglets Tout/Points/Visionnage/Récompenses/Tirages, filtre plateformes et plage de dates doivent être séparés et alignés sur une même ligne à 1280 px.

### 6. `viewer-extension-detaille.png` → `/dashboard/extension`

Code observé : `CodeAppariement.tsx`, `LocalizedDashboardExtension` et page route.

- **P1 - structure** : la référence est composée d'un header illustré, d'une zone navigateurs compatibles, d'un panneau état extension, d'un parcours en trois étapes avec code, d'une liste appareils et d'une zone confidentialité. Le code actuel concentre principalement le texte d'introduction et l'appariement ; la présence de toutes ces zones visuelles n'est pas démontrée.
- **P1 - appareils** : chaque appareil doit afficher navigateur, machine, statut, dernière activité et révocation ; les états connecté, expiré, révoqué et erreur doivent conserver la même ligne structurée.
- **P2 - code** : le code doit être une zone visuellement délimitée, avec copie, expiration et reprise ; ne pas réduire l'information à un simple bouton.
- **P2 - assets** : Chrome, Edge, Firefox et plateformes doivent utiliser les assets/icônes du kit avec taille stable, alternative textuelle et contraste visible.

### 7. `dashboard-admin-principal.png` → `/admin`

Code observé : `frontend/src/app/admin/page.tsx`.

- **P1 - topbar** : la référence exige environnement, lien site, notifications, avatar et identité sur une ligne fixe. Le code affiche des libellés contractuellement neutres, mais la densité et l'alignement doivent être mesurés à 1280 px ; aucun texte d'exemple de maquette ne doit être réintroduit.
- **P1 - tableaux** : la cible comporte quatre KPI puis deux tableaux riches (tirages et lots) et trois panneaux inférieurs (éditorial, modération, audit), avec colonnes, vignettes, badges et actions par ligne. Le code rend des tableaux de synthèse à trois colonnes sans vignettes ni statut détaillé.
- **P1 - hiérarchie** : la zone tirages doit occuper environ 60 % et lots 40 % ; la zone inférieure doit être trois colonnes à desktop. Le code utilise deux colonnes puis deux colonnes et ne reproduit pas les trois panneaux simultanés.
- **P2 - KPI** : icônes et couleurs par domaine (tirages, lots, annonces, signalements), valeur et sous-total doivent être alignés sur une hauteur commune ; les valeurs zéro doivent conserver la même structure.

### 8. `admin-tirage-detaille.png` → `/admin/raffles`

Code observé : route et `AdminSectionPage`.

- **P0 - écran cockpit** : la maquette comporte un en-tête de détail, bloc lot illustré, période, trois KPI participation, règles d'éligibilité, obligation extension, nombre gagnants, informations audit, progression en trois étapes et alertes dans une colonne droite. Une liste admin générique ne constitue pas cette composition.
- **P1 - colonne de progression** : la colonne droite doit rester fixe visuellement, contenir l'étape courante, CTA de préparation, bloc succès/erreurs et journal d'audit ; mesurer une largeur de 30-34 % à 1280 px.
- **P2 - actions protégées** : boutons modifier, préparer, lancer et plus d'actions doivent avoir des niveaux de danger distincts et une confirmation visible.

### 9. `admin-lots-detaille.png` → `/admin/lots`

Code observé : route et `AdminSectionPage`.

- **P0 - panneau de création** : la référence exige un drawer droit de création/édition avec upload image, aperçu, champs, validation et toast. Une page de liste sans drawer ne satisfait pas l'écran.
- **P1 - inventaire** : cinq KPI en tête, filtres, toggle liste/grille, table avec image, nom, type, stock, disponibilité, statut, tirage lié, dernière mise à jour et actions. Le code doit exposer chaque colonne sans les remplacer par un résumé.
- **P1 - densité** : à 1280 px, la table doit utiliser environ 70 % de la largeur utile et le drawer 30 %, sans overflow horizontal ; à 768 px le drawer devient une surface pleine largeur.
- **P2 - validation** : erreurs de valeur, stock et disponibilité doivent apparaître près du champ puis dans une alerte globale, comme dans la référence.

### 10. `admin-annonces-contenus-detaille.png` → `/admin/announcements`, `/admin/content`

Code observé : `GestionContenu.tsx` et `AdminSectionPage`.

- **P0 - éditeur latéral** : la référence présente liste sélectionnable à gauche et éditeur à droite avec onglets édition/versions/historique, média et actions publier/planifier/archiver. Le code doit démontrer cette relation master/detail, pas seulement un modal générique.
- **P1 - liste** : onglets Toutes/Brouillons/Planifiées/Publiées/Archivées avec compteurs, recherche, type, statut, période et table avec checkbox, miniature, titre, type, statut, date, version, auteur et actions.
- **P1 - éditeur** : les champs titre, type, statut, message riche, image/alt, date, audience et épinglage doivent conserver une grille à deux colonnes et des compteurs de caractères.
- **P2 - feedback** : succès, erreur de validation et état sauvegardé doivent être visibles dans le panneau sans déplacer le tableau.

### 11. `admin-signalements-utilisateurs-detaille.png` → `/admin/moderation`, `/admin/users`, `/admin/audit`

Code observé : `AdminSectionPage` et les routes secondaires.

- **P0 - dossier de signalement** : la référence exige une table centrale et un dossier latéral avec identité anonymisée, motif, priorité, preuves, chronologie, note et décisions. Une vue de liste ou un détail sans preuves/timeline ne suffit pas.
- **P1 - onglets et KPI** : onglets Signalements/Utilisateurs, quatre KPI et filtres recherche/statut/priorité/motif/période doivent être présents et alignés.
- **P1 - contexte utilisateur** : le dossier doit inclure statut/rôle, inscription, dernière activité, extensions associées et historique audit ; aucun bloc ne doit inventer de valeur lorsque le contrat est vide.
- **P2 - actions** : avertir, restreindre et classer doivent être des actions protégées, colorées par risque, avec état de progression et retour serveur.
- **P2 - audit** : l'écran `/admin/audit` doit réutiliser la timeline et les filtres de traçabilité, au lieu d'un simple tableau non contextualisé.

### 12. `ecrans-secondaires-viewer.png` → composition transversale viewer

- **P1** : les quatre mini-écrans confirment une sidebar commune, une largeur de contenu stable, des cartes à densité élevée et des états illustrés. Les routes actuelles partagent le shell, mais leurs pages utilisent encore des introductions et listes de densité différente.
- **P2** : harmoniser l'icône active, le rayon des cartes, le gradient de focus, les badges plateforme et les boutons CTA. Cible : mêmes tokens et mêmes hauteurs de contrôle sur les quatre routes.

### 13. `ecrans-secondaires-admin.png` → composition transversale admin

- **P1** : les quatre vues confirment un shell admin compact et une logique liste + détail/drawer. Les routes existent, mais la fidélité ne sera démontrée que lorsque tirages, lots, contenus et signalements auront leur panneau associé.
- **P2** : aligner les libellés de navigation, les états actifs, les badges et les actions de ligne. Aucun écran ne doit afficher la navigation publique viewer dans l'espace admin.

## Écarts transverses à traiter après les P0/P1

1. **Assets et icônes - P2** : les maquettes utilisent des illustrations média, logos plateformes et icônes métier dédiées. `SkkupIcon` couvre une partie des symboles, mais il faut un inventaire par écran et une source réelle pour chaque média. Les emojis et caractères décoratifs isolés ne doivent pas remplacer un asset lorsque la référence en montre un.
2. **Tokens - P2** : vérifier une palette commune pour fond, panneau, panneau élevé, bordure, texte, accent violet, cyan, succès, avertissement et erreur. Les valeurs doivent être centralisées, non redéfinies par écran.
3. **Densité - P2** : cible générale 16-24 px de padding de panneau, 12-16 px entre lignes, titres 28-40 px selon le niveau et boutons de 40-44 px de haut. Valider par capture à 1280 px.
4. **Responsive - P1** : à 768 px les grilles passent en une colonne fonctionnelle sans écraser les tables ; à 320 px la sidebar devient un contrôle compact, les tableaux deviennent des cartes ou défilements explicitement maîtrisés et aucun overflow horizontal ne dépasse la viewport.
5. **États - P1** : chaque route doit avoir loading, empty, error et success dans la même composition que l'écran nominal. Les états vides actuels sont souvent textuels et ne conservent pas les zones de médias, CTA et compteurs attendues.
6. **Accessibilité - P2** : focus visible sur toutes les actions, nom accessible sur icônes, ordre clavier cohérent dans les drawers/panneaux, et annonce des changements de filtre/pagination.

## Critères de sortie de la phase design fidelity

La phase ne sera considérée comme terminée que lorsque :

- les 13 références auront un mapping route/composant/panneau, avec aucune zone P0 ouverte ;
- chaque écran aura une capture de référence et une capture de l'implémentation à 1280 px, puis des contrôles 768/320 px ;
- les différences de grille, largeur, hauteur, gap, padding, ratio média et hiérarchie seront mesurées et documentées ;
- les états loading/empty/error/success seront représentés dans la même géométrie que l'état nominal ;
- les assets et icônes seront inventoriés, sourcés et reliés à un composant ou à un état contractuel ;
- le spécialiste design fidelity aura relu le rapport corrigé, puis seulement le document de gel pourra passer à `design gelé`.

## Conclusion de phase 1

Le socle de navigation, les routes et plusieurs contrats réels existent, mais ils ne constituent pas encore une reproduction fidèle des 13 maquettes. Les priorités immédiates sont les sept compositions P0 (panneaux master/detail et cockpits admin), puis les grilles et tableaux P1. Aucune validation de Definition of Done, de recette finale ou de fusion dans `dev` ne peut être déduite de l'état actuel.
