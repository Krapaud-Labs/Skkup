# Direction artistique et expérience visuelle

## Statut et intention

Statut : draft, baseline Framer Motion adoptée pour DASH-V3

Univers néon violet, ludique et premium, qui rend la progression et la transparence immédiatement lisibles sans promettre de gain financier.

## Références et anti-références

- Références : interfaces gaming sobres, néon maîtrisé, cartes de progression.
- Anti-références : casino agressif, clignotements, promesses d'enrichissement.
- Différenciation attendue : marque Skkup, transparence des règles et dashboard orienté régularité.

## Système visuel

| Élément | Décision | Justification produit | Exemple ou token |
| --- | --- | --- | --- |
| Palette | violet néon, surfaces sombres, accents contrastés | univers Skkup lisible | tokens design existants |
| Typographie | sans-serif lisible | dashboard dense mais accessible | styles frontend |
| Espacement | grille régulière et responsive | hiérarchie claire | tokens CSS |
| Formes et profondeur | cartes arrondies, profondeur modérée | gamification sans casino | composants UI |
| Iconographie et illustration | icônes simples et lots réels | compréhension rapide | assets contrôlés |

## Composants, états et motion

Documenter les composants réutilisables, les états loading, vide, erreur, succès, focus et désactivé. Décrire les transitions, durées, courbes, déclencheurs et comportement avec `prefers-reduced-motion`.

### Baseline Framer Motion DASH-V3

La dépendance `framer-motion` du frontend est la baseline d'animation des
dashboards viewer et admin. Elle est utilisée pour :

- l'entrée progressive des régions de page et des cartes KPI ;
- les changements de sélection, filtres, tiroirs et panneaux master-detail ;
- les feedbacks de succès, d'erreur, de chargement et de mise à jour ;
- les micro-interactions des cartes, actions et éléments de navigation.

Règles : une animation doit clarifier l'état ou la hiérarchie, rester courte,
être interrompable et ne jamais masquer une donnée réelle. Les composants
doivent prévoir `useReducedMotion` ou une variante statique équivalente. Aucun
placeholder animé, compteur fictif ou effet décoratif ne peut remplacer un
contrat API, une permission ou un état vide.

Prévoir loading, vide, erreur, succès, focus et désactivé. Respecter `prefers-reduced-motion` et éviter toute animation nécessaire à la compréhension.

## Responsive, accessibilité et performance

Responsive mobile, tablette et desktop ; navigation clavier ; focus visible ; contraste vérifié ; texte redimensionnable ; images optimisées et chargement différé des médias non critiques.

## Validation visuelle

Captures attendues : vitrine, inscription, dashboard, extension et admin.
Parcours vérifiés : inscription, appariement, visionnage et tirage.
Auditeur : à désigner.
Date : à planifier.
---
last_updated: 2026-09-25
---
