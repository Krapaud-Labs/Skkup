# Direction artistique et expérience visuelle

## Statut et intention

Statut : draft

Univers néon violet, ludique et premium, qui rend la progression et la transparence immédiatement lisibles sans promettre de gain financier.

## Références et anti-références

- Références : interfaces gaming sobres, néon maîtrisé, cartes de progression.
- Anti-références : casino agressif, clignotements, promesses d'enrichissement.
- Différenciation attendue : marque Skkup, transparence des règles et dashboard orienté régularité.

## Système visuel

| Élément | Décision | Justification produit | Exemple ou token |
| --- | --- | --- | --- |
| Palette | violet néon, surfaces sombres, accents contrastés | univers Skkup lisible | classes et tokens `frontend/src/app/globals.css` |
| Typographie | sans-serif lisible | dashboard dense mais accessible | `frontend/src/app/layout.tsx`, styles frontend |
| Espacement | grille régulière et responsive | hiérarchie claire | composants avec variantes responsive; `frontend/e2e/responsive-accessibility.spec.ts` |
| Formes et profondeur | cartes arrondies, profondeur modérée | gamification sans casino | `frontend/src/components/ui/CarteGlow.tsx`, classes `skuup-*` |
| Iconographie et illustration | icônes simples et lots réels | compréhension rapide | `frontend/src/components/ui/SkkupIcon.tsx`, inventaire médias |

## Composants, états et motion

Les composants réutilisables sont notamment `CarteGlow`, `SkkupIcon`, `BarreProgressionStreak`, les navigations viewer/admin et les formulaires d'authentification. Les états loading, vide, erreur, succès, focus et désactivé sont exercés dans les composants et tests associés. Les transitions et le comportement `prefers-reduced-motion` restent à vérifier dans une capture ou un contrôle navigateur dédié.

Prévoir loading, vide, erreur, succès, focus et désactivé. Respecter `prefers-reduced-motion` et éviter toute animation nécessaire à la compréhension.

## Responsive, accessibilité et performance

Responsive mobile, tablette et desktop ; navigation clavier ; focus visible ; texte redimensionnable ; images optimisées et chargement différé des médias non critiques. Preuves disponibles : `frontend/e2e/responsive-accessibility.spec.ts` vérifie l'absence de débordement, les alternatives textuelles et le parcours clavier; les contrastes et `prefers-reduced-motion` restent à mesurer séparément.

## Validation visuelle

Captures attendues : vitrine, inscription, dashboard, extension et admin.
Parcours vérifiés : inscription, appariement, visionnage et tirage.
Auditeur : non désigné; les contrôles automatisés ne remplacent pas la validation visuelle.
Date : à planifier avant la validation visuelle frontend; responsable : Mickael MUR.
---
last_updated: 2026-10-03
---
