# Audit responsive et accessibilité FR/EN

## Périmètre

Audit du check Trello « Tester le rendu responsive et l’accessibilité dans les deux langues » sur la branche `feature/i18n-responsive-a11y`, créée depuis `origin/dev`.

Surfaces inspectées dans le code : vitrine publique, pages FAQ/inscription/connexion, dashboard, administration et popup de l’extension. Les composants de navigation, les sélecteurs de langue, les états de chargement/erreur et les styles responsive ont été vérifiés.

## Corrections apportées

- `document.documentElement.lang` est maintenant synchronisé dès le montage avec la langue active, y compris après restauration du choix mémorisé.
- Les libellés ARIA de la navigation publique, du logo, du sas dashboard, de l’historique des tirages et du règlement suivent FR/EN.
- Le bouton de déconnexion de l’en-tête public utilise désormais le catalogue de traductions.
- Le statut du règlement est disponible en français et en anglais.
- Un test vérifie la synchronisation de `document.lang` lors du changement de langue.

## Vérification navigateur

Chrome connecté a été utilisé sur `https://skkup.fr/`.

- En FR : la navigation, le sélecteur et le contenu principal sont rendus en français.
- En EN : le sélecteur passe à `EN`, les libellés de navigation, le hero, les statistiques, les sections et les textes alternatifs observés sont en anglais.
- Le sélecteur expose un nom accessible (« Langue » / « Language ») et la page expose une structure de titres et de liens lisible dans l’arbre d’accessibilité.

## Responsive et limites

Les règles CSS inspectées couvrent les seuils `900px`, `768px` et `640px`, la réduction des animations, le passage de la grille dashboard en une colonne et la navigation repliée. L’extension expose également des focus visibles et une préférence `prefers-reduced-motion`.

Le navigateur connecté ne fournit pas de redimensionnement de viewport ni d’audit axe intégré dans cette session. Opera, Firefox et Safari ne sont pas connectés à l’automatisation ; aucune validation réelle de ces navigateurs ni de dimensions mobiles n’est déclarée. Ces points restent ouverts dans Trello tant qu’une preuve correspondante n’est pas disponible.
