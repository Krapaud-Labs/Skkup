# DASH-V3 - Formats et dimensions des assets

Les assets raster générés sont servis avec une taille adaptée à leur usage,
et non avec la résolution brute de génération.

| Asset | Format | Dimensions servies | Usage |
|---|---|---:|---|
| `frontend/public/branding/generated/skkup-icon-*.png` | PNG RGBA | 256 × 256 | icônes illustrées, affichage CSS jusqu'à 64 px |
| `frontend/public/assets/dashboard-v3/reward-art-sprite-v1.png` | PNG RGB | 768 × 768 | sprite de trois cartes, affichage en background 3 colonnes |

Les proportions et la transparence des icônes ont été conservées. Les fichiers
de référence dans `docs/design/skkup-dashboard-references/` restent inchangés,
car ils servent à la comparaison visuelle et ne sont pas des assets produits.
