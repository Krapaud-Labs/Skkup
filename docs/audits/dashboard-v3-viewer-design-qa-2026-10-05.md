# Audit QA design viewer DASH-V3

Date : 5 octobre 2026  
Périmètre : `/dashboard`, `/dashboard/streams`, `/dashboard/tirages`, `/dashboard/recompenses`, `/dashboard/historique`, `/dashboard/extension`  
Références : `docs/design/skkup-dashboard-references/dashboard-viewer-principal.png`, `ecrans-secondaires-viewer.png` et les cinq maquettes `viewer-*-detaille.png`, complétées par `docs/design/dashboard-v3-viewer-spec.md`.

## Conclusion

**Non conforme pour la livraison visuelle.** Les routes viewer existent, leurs appels et états principaux sont testés, mais la composition réellement codée reste une version allégée de la maquette. L’écart n’est pas limité aux données absentes : plusieurs éléments de structure visibles dans les maquettes n’ont pas d’équivalent dans les composants.

L’audit est statique et fondé sur les fichiers présents dans le dépôt, les maquettes PNG et les tests exécutables. Aucune session authentifiée de production n’a été utilisée pour inventer un rendu non observé. Les captures présentes dans `docs/design/evidence/dashboard-viewer-*.png` sont des preuves de prototype/état vide et ne prouvent pas la conformité aux maquettes viewer détaillées.

## Preuves contrôlées

- Maquette principale : `docs/design/skkup-dashboard-references/dashboard-viewer-principal.png` (1586 × 992).
- Planche secondaire : `docs/design/skkup-dashboard-references/ecrans-secondaires-viewer.png` (1900 × 828).
- Détails : `viewer-streams-detaille.png`, `viewer-tirages-detaille.png`, `viewer-recompenses-detaille.png`, `viewer-historique-detaille.png`, `viewer-extension-detaille.png` (1536 × 1024 chacun).
- Spécification : `docs/design/dashboard-v3-viewer-spec.md`, notamment les sections 2 à 10.
- Shell : `frontend/src/components/dashboard/DashboardSas.tsx:59-86`.
- Navigation : `frontend/src/components/dashboard/NavigationDashboard.tsx:24-70`.
- Cockpit : `frontend/src/components/dashboard/TableauDeBord.tsx:328-380` et les sous-régions `:410-777`.
- Routes secondaires : `frontend/src/app/dashboard/*/page.tsx`.
- Composants fonctionnels : `frontend/src/components/streams/ListeStreams.tsx`, `frontend/src/components/raffles/ListeTirages.tsx`, `frontend/src/components/dashboard/CentreRecompenses.tsx`, `frontend/src/components/dashboard/HistoriquePointsViewer.tsx`, `frontend/src/components/extension/CodeAppariement.tsx`.
- Styles : `frontend/src/app/globals.css:250-421` et `frontend/src/app/viewer-secondary.css`.

## Écarts P0

P0 signifie que l’écart empêche de déclarer la carte conforme aux maquettes viewer, même si les tests fonctionnels passent.

| Priorité | Écran | Écart vérifié | Preuve actuelle | Attendu maquette | Action de clôture |
|---|---|---|---|---|---|
| P0 | `/dashboard` | Le cockpit ne reprend pas la structure principale : la maquette contient une barre de trois KPI, un bloc visionnage avec vraie miniature, statut LIVE, plateformes, minuterie circulaire et bandeau de gain, puis deux colonnes récompenses/tirages et une activité dense. Le composant rend des KPI, un seul `StreamFeatureCard`, extension, récompenses, tirages, historique et tickets, mais aucune minuterie de visionnage, aucun état LIVE/visiteurs, aucun bandeau de gain contractuel et pas de liste d’activité de sessions équivalente. | `TableauDeBord.tsx:333-380`, `:410-451`, `:587-777` ; aucune occurrence de minuterie/compteur de session dans le composant. | Reproduire la hiérarchie et la densité de `dashboard-viewer-principal.png`, sans remplir les valeurs absentes : afficher les états contractuels prévus par la spécification. | Recomposer le cockpit par sous-composants dédiés et valider sur un état de données réel et un état vide.
| P0 | `/dashboard/streams` | La maquette détaillée prévoit un bandeau d’extension connecté, onglets de plateformes avec compteurs, filtres catégorie/langue/tri, grille de 4 cartes média avec avatar, LIVE, spectateurs, jeu/catégorie, bonus, bouton et favori. Le composant ne rend qu’un titre, trois statistiques génériques, recherche, filtre plateforme, grille de 4 colonnes, miniature/nom/plateforme/bonus et lien externe. | `ListeStreams.tsx:103-167` ; aucun filtre catégorie, langue ou tri ; aucune donnée de spectateurs/avatar/LIVE/catégorie. | Reproduire la structure visible de `viewer-streams-detaille.png`, ou documenter explicitement chaque absence dans le contrat et conserver une structure visuelle équivalente. | Ajouter les éléments dont le contrat dispose ; pour le reste, adapter l’API ou créer un état neutre fidèle, sans fake data. Ajouter un test de présence structurelle par état.
| P0 | `/dashboard/tirages` | Le composant fournit un master/detail mais le détail est beaucoup plus petit que la référence : pas de carte lot illustrée de grande taille, pas de compteurs participants/tickets, pas de compte à rebours, pas d’onglets Détails/Règles/Contenu du lot, pas de bloc d’alerte manque de tickets ni de bouton de confirmation équivalent. | `ListeTirages.tsx:109-144` ; la zone détail ne contient qu’un visuel iconographique, titre, tickets, lots et action. | Reproduire `viewer-tirages-detaille.png` avec données réelles et états d’autorisation/solde. | Étendre le contrat si nécessaire, puis construire le panneau de détail et les états ouverts, clos, résultats et tickets insuffisants.
| P0 | `/dashboard/recompenses` | La référence est une collection illustrée avec onglets comptés, recherche/tri, cartes disponibles/verrouillées/utilisées, progression, illustration riche et panneau de détail. Le composant actuel repose sur une grille générique de cartes et une sélection, sans recherche/tri visibles ni illustrations de carte de la référence ; les états verrouillés/progression sont réduits aux champs disponibles. | `CentreRecompenses.tsx` (structure de collection/sélection) et `globals.css:347-350` ; le CSS utilise une marque générique au lieu d’une composition d’illustration par carte. | Reproduire `viewer-recompenses-detaille.png` en gardant les valeurs serveur et en distinguant clairement disponible, verrouillée, utilisée et gain confirmé. | Ajouter la barre de recherche/tri, les compteurs d’onglet et la composition visuelle complète ; ne jamais afficher un gain avant la réponse du serveur.
| P0 | `/dashboard/historique` | La référence est une table dense avec colonnes plateforme/type/description/durée/points/éléments/date/statut, KPI points et temps de visionnage, filtres plateforme/date et panneau de détail riche. Le composant rend uniquement l’historique des points : trois colonnes Type/Date/Montant, filtres type/période et un détail minimal. | `HistoriquePointsViewer.tsx:50-63` ; aucun flux de sessions de visionnage, filtre plateforme, durée, statut, éléments ou panneau métier. | Reproduire `viewer-historique-detaille.png` et séparer explicitement transactions de points et sessions de visionnage conformément à la section 7 de la spec. | Obtenir une source contractuelle approuvée pour les sessions, construire les deux vues et afficher un état indisponible distinct si la source n’existe pas.
| P0 | `/dashboard/extension` | La maquette inclut logos officiels Chrome/Edge/Firefox, statut connecté avec dernière activité, parcours visuel en trois étapes, code avec copie et expiration, appareils nommés avec statut/dernière activité, révocation et panneau de confidentialité. Le code rend des cartes navigateur avec la même icône générique `extension`, un état d’association sans dernière activité et des appareils nommés seulement « Appareil associé » avec date. | `frontend/src/app/dashboard/extension/page.tsx` ; `CodeAppariement.tsx:127-191`. | Reproduire `viewer-extension-detaille.png`, tout en conservant le secret et les données de statut côté serveur. | Utiliser les assets de plateforme validés, afficher seulement les champs réellement fournis, et rendre les étapes/états de connexion avec la même densité que la référence.
| P0 | Toutes les routes | La comparaison visuelle écran par écran n’est pas automatisée et les captures `docs/design/evidence/dashboard-viewer-*.png` montrent un état de prototype/vide, pas les cinq écrans détaillés ni un jeu de données non vide. | Les tests E2E vérifient structure/overflow/accessibilité mais ne font aucune comparaison d’image ; `dashboard-v3-prototype.spec.ts` cible le fichier prototype HTML. | Une preuve par route et par breakpoint 320/768/1280, avec données contractuelles ou état vide explicitement identifié. | Ajouter des captures de recette navigateur et un contrôle perceptuel ou une checklist visuelle signée par un QA indépendant.

## Écarts P1

| Priorité | Écart vérifié | Preuve | Impact |
|---|---|---|---|
| P1 | Le shell ne correspond pas aux variantes de logo des maquettes détaillées et la barre supérieure ne reprend pas partout le même niveau d’information (recherche sur écrans secondaires, notifications, identité et solde). | `DashboardSas.tsx:63-83` ; logo unique `skkup-wordmark-transparent.png` et topbar limitée au pseudo, notification et menu. | Rupture de continuité visuelle entre cockpit et écrans secondaires.
| P1 | La navigation viewer contient `Règlement` et `Mon compte`, alors que la planche détaillée visible met en avant Dashboard, Streams, Tirages, Récompenses, Historique, Extension et Mon compte ; la cohérence des libellés et de l’ordre doit être arbitrée avec la spec. | `NavigationDashboard.tsx:14-21`, `:35-46`. | Risque de navigation différente de la maquette et de surcharge du rail.
| P1 | Les tokens ne sont pas centralisés comme demandé : les styles viewer V3 et secondaires redéfinissent de nombreuses couleurs/gradients directement dans `globals.css`. | `docs/design/dashboard-v3-viewer-spec.md:15-20` contre `globals.css:250-421`. | Les routes peuvent diverger et les ajustements de fidélité deviennent fragiles.
| P1 | Le catalogue n’a pas de statut de session de visionnage ni de mutation `POST /watch-sessions`; son bouton ouvre seulement un lien externe. | `ListeStreams.tsx:154-162` ; la spec section 4 prévoit `POST /watch-sessions` et `WatchSessionStatus`. | Le rendu et l’action principale de la maquette ne sont pas équivalents fonctionnellement.
| P1 | Le filtre local du catalogue ne remet pas explicitement `page` à 1 quand la plateforme change dans le chemin principal non vide. | `ListeStreams.tsx:129-136` contre la recherche `:127`. | Une combinaison de filtres peut afficher une page vide alors que des résultats existent.
| P1 | Les favoris sont persistés uniquement dans `localStorage`, sans contrat utilisateur ni synchronisation multi-appareil. | `ListeStreams.tsx:27-35`, `:53-57`. | Fonctionnalité visuelle présente mais non garantie comme fonctionnalité de compte.
| P1 | Les états communs de la spec ne sont pas homogènes : certaines sections ont chargement/erreur/vide, mais le shell et plusieurs panneaux n’ont pas de composant `StatusPanel` partagé et les densités de skeleton ne correspondent pas aux contenus finaux. | `dashboard-v3-viewer-spec.md:21-36`, `TableauDeBord.tsx:320-328`, `ListeStreams.tsx:97-101`. | Les transitions peuvent modifier brutalement la grille et dégrader la perception premium.
| P1 | L’extension affiche « Navigateur Chromium » et « Navigateur indépendant » mais utilise le même pictogramme pour les trois navigateurs. | `frontend/src/app/dashboard/extension/page.tsx`, carte `skuup-browser-logo`. | Écart d’iconographie visible et confusion sur l’installation.
| P1 | Les tests de composants ne couvrent pas la fidélité des classes, la présence des régions structurantes de chaque maquette, les filtres secondaires, le statut session ou les assets de plateforme. | `TableauDeBord.test.tsx`, `ListeStreams.test.tsx`, `ListeTirages.test.tsx`, `CodeAppariement.test.tsx`. | Une régression de design peut passer avec tous les tests verts.
| P1 | Les tests responsive mesurent l’absence de débordement et l’accessibilité, pas la taille/position/densité des blocs par rapport aux PNG. | `frontend/e2e/responsive-accessibility.spec.ts`, `dashboard-responsive-live.spec.ts`. | Un écran très différent peut rester vert.

## Tests vérifiés

### Exécutés avec résultat

Commande exécutée dans l’image `skkup-frontend-test` : `npm test`.

- **28 fichiers de test passés**.
- **109 tests passés**.
- Les tests viewer concernés passent notamment : `TableauDeBord.test.tsx` (15), `ListeStreams.test.tsx` (6), `ListeTirages.test.tsx` (5), `CodeAppariement.test.tsx` (6), `NavigationDashboard.test.tsx` (2), `MenuCompteDashboard.test.tsx` (7).
- Ce résultat prouve les comportements unitaires/composants couverts, pas la conformité aux maquettes.

### Disponibles mais non utilisés comme preuve de fidélité

- `frontend/e2e/dashboard-viewer-main-live.spec.ts` : parcours principal live, dépend d’une session et de données simulées/autoroutes ; ne compare pas de pixels.
- `frontend/e2e/dashboard-v3-secondary-live.spec.ts` : routes secondaires et états ; ne compare pas de pixels.
- `frontend/e2e/dashboard-responsive-live.spec.ts` : responsive live ; vérifie dimensions/contrôles, pas la composition visuelle.
- `frontend/e2e/responsive-accessibility.spec.ts` : overflow, noms accessibles, focus et contraste ; ne vérifie pas la maquette.
- `frontend/e2e/dashboard-v3-prototype.spec.ts` : cible `docs/design/dashboard-prototype-2.0.html`, donc le prototype et non les composants Next viewer.

Aucun test trouvé ne fait de comparaison avec `dashboard-viewer-principal.png`, `ecrans-secondaires-viewer.png` ou les fichiers `viewer-*-detaille.png`. Aucun résultat E2E live authentifié n’est donc présenté ici comme preuve.

## Ordre recommandé de correction

1. **P0 cockpit** : reconstruire `/dashboard` autour de la grille de la maquette et des seules données contractuelles disponibles.
2. **P0 écrans secondaires** : traiter chaque route dans l’ordre `streams`, `tirages`, `recompenses`, `historique`, `extension`, avec une capture 1280 puis 768/320 à la fin de chaque écran.
3. **P0 preuve** : ajouter une recette visuelle indépendante et séparer les captures état vide, chargement, erreur et données réelles.
4. **P1 cohérence** : shell/logo/navigation/tokens partagés, puis renforcer les tests structurels et responsive.

## Verdict QA

Les tests disponibles sont verts, mais ils ne couvrent pas le risque demandé. La Definition of Done design viewer ne peut pas être déclarée satisfaite : **7 écarts P0 ouverts** et **10 écarts P1 ouverts** sont documentés ci-dessus. Aucun code n’a été modifié pendant cet audit.
