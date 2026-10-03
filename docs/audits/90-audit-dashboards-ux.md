# Audit UX des dashboards utilisateur et administrateur

## Périmètre

Audit visuel indépendant réalisé dans Chrome sur la version déployée de Skkup, le 3 octobre 2026, avec le compte administrateur autorisé.

Écrans contrôlés :

- `/dashboard`.
- `/admin`.

## Constats initiaux

- Le dashboard viewer utilise bien trois zones, mais la zone centrale conserve une grande surface vide lorsque le nombre d'annonces est faible.
- Le hero et les statistiques viewer sont fusionnés dans une même surface sans séparation visuelle assez nette entre identité et indicateurs.
- La colonne de gauche mélange régularité et récompenses sans hiérarchie explicite.
- La colonne de droite affiche la loterie, mais son état vide ne propose aucune action ni information de calendrier.
- Le dashboard administrateur utilise le même univers graphique, mais sa navigation est visuellement plus lourde et plus dense que celle du viewer.
- La navigation administrateur affichait deux intitulés équivalents « Vue d'ensemble », ce qui rendait la destination viewer ambiguë.
- Les filtres administrateur occupent une surface importante avant les contenus opérationnels.
- Les formulaires, listes et historiques administrateur sont présentés dans une même longue page sans regroupement visuel assez fort par tâche.

## Première correction appliquée

Le lien administrateur vers le dashboard viewer utilise maintenant un intitulé explicite : « Espace viewer » et « Ouvrir le dashboard viewer ». L'intitulé anglais équivalent est également fourni.

## Critères de poursuite

- Conserver une grille viewer lisible avec une colonne centrale prioritaire et deux colonnes secondaires réellement utiles.
- Réduire les surfaces vides dans les états sans données.
- Unifier les dimensions de hero, les espacements, les bordures, les rayons et les états de focus entre viewer et admin.
- Donner une hiérarchie distincte aux actions de navigation, aux contenus métier, aux formulaires et aux historiques.
- Tester les états chargement, vide, erreur, contenu long, modal et viewport mobile.
- Capturer un rendu avant et après pour chaque écran corrigé.

## Preuves

- Rendu Chrome du dashboard viewer : hero, bandeau de statistiques, trois colonnes, annonce et loterie vide observés.
- Rendu Chrome du dashboard administrateur : hero, cinq cartes de navigation, filtres, sponsor et signalements observés.
- `npm run lint` frontend : succès.
- Test `NavigationAdmin.test.tsx` : 1 fichier et 1 test réussis.

## État

Audit en cours. La correction de l'intitulé ambigu est validée localement. Les améliorations structurelles et visuelles restantes restent ouvertes.
