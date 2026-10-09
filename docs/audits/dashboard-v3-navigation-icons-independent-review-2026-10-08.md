# Revue frontend indépendante DASH-V3 : pictogrammes de navigation

Date : 2026-10-08
Périmètre : `frontend/src/app/globals.css`, `NavigationDashboard.tsx` et `NavigationAdmin.tsx`.

## Contrôles exécutés

- Diff CSS DASH-V3 relu, notamment les règles `.skuup-dashboard-action-icon`.
- Rendu des composants viewer et admin relu.
- `git diff --check` : OK.
- Tests ciblés : `NavigationDashboard.test.tsx` et `NavigationAdmin.test.tsx` : **2 fichiers, 3 tests réussis**.
- Test E2E `responsive-accessibility.spec.ts` : non exécutable dans cette session, le serveur Next n’a pas pu ouvrir `127.0.0.1:3000` (`listen EPERM`). Ce contrôle n’est donc pas déclaré réussi.

## Résultats

### Sans bordure ni fond

La règle ajoutée à `globals.css` supprime `border`, `background` et `box-shadow` uniquement sous `.skuup-premium-dashboard-shell`. Elle ne couvre pas la coque admin `.skuup-premium-admin-shell`, qui conserve donc le style de base de la pastille. Le style de l’état actif reste porté par le lien `.skuup-premium-dashboard-nav-active`, et non par le conteneur du pictogramme. **Écart admin confirmé statiquement.**

### Agrandissement des pictogrammes

**Non vérifié, écart détecté.** La règle ajoutée cible uniquement :

```css
.skuup-dashboard-action-icon > svg:first-child
```

Or `SkkupIcon` retourne un composant `Image`, donc un élément `<img>`, pour les assets utilisés par la navigation (`overview`, `streams`, `draws`, `gift`, `rules`, `users`, `points`, `extension`). Ces images conservent leurs dimensions `20×20` passées par `NavigationDashboard` et `NavigationAdmin`. La règle ne les agrandit pas.

### Active state

Les deux composants continuent à calculer `actif` et `aria-current` comme avant. Aucun sélecteur de taille ou de décoration du pictogramme ne neutralise le fond, la bordure transparente ou l’ombre du lien actif. **Vérifié par lecture du diff et des composants.**

### Responsive

Les règles `@media (max-width: 900px)` conservent la navigation en disposition responsive. Le conteneur d’icône reste non flexible (`flex: 0 0 2rem`) dans les règles de navigation existantes. Aucun test visuel aux largeurs 320, 768 et 1280 n’a été exécuté dans cette passe. **Non régressif non prouvé visuellement.**

## Verdict

**NEEDS-REVIEW / REWORK** : la conservation de l’état actif est conforme, mais l’agrandissement demandé n’est pas effectif pour les assets `<img>` et la pastille admin n’est pas supprimée. Corriger la portée CSS et cibler `svg` et `img` (ou une classe stable), puis rejouer les tests et une vérification responsive/accessibilité visuelle aux trois largeurs. Le contrôle E2E reste à rejouer dans un environnement autorisant l’ouverture du serveur local.

## Relecture après correction locale `99968e3`

La surcharge finale commune aux deux shells cible explicitement
`.skuup-generated-icon` (les assets `next/image`, donc des `<img>`) et les SVG
inline. Elle impose `1.55rem` sans bordure, fond ni ombre. Les tests frontend
ciblés et le typecheck passent.

La tentative Playwright live de cette passe n’est pas une preuve exploitable :
l’API staging a répondu `401` pendant l’authentification, puis le tunnel a été
réinitialisé. Aucun verdict visuel aux largeurs 320/768/1280 n’est déduit de
cette tentative. Une nouvelle capture live reste requise avant livraison.
