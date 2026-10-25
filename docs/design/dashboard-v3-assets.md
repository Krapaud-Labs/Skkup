---
last_updated: 2026-10-25
owner: Mickael MUR
---

# DASH-V3 - Formats et dimensions des assets

Les assets raster générés sont servis avec une taille adaptée à leur usage,
et non avec la résolution brute de génération.

| Asset | Format | Dimensions des fichiers source | Usage |
| --- | --- | ---: | --- |
| `frontend/public/assets/ui-icons/*.png` | PNG | 96 × 96 | pictogrammes d'interface, affichage généralement entre 16 et 24 CSS px |
| `frontend/public/assets/dashboard/shared/icons/skkup-icon-*.png` | PNG RGBA | 1254 × 1254 | illustrations métier Skkup, affichage réduit selon le composant |
| `frontend/public/assets/dashboard/user/rewards/reward-art-sprite-v1.png` | PNG | 768 × 768 | sprite de trois cartes, affichage en background 3 colonnes |

Les dimensions ci-dessus ont été contrôlées sur les fichiers présents dans le
dépôt. L'ancien chemin `frontend/public/branding/generated/skkup-icon-*.png`
n'existe pas dans l'arborescence actuelle et ne doit pas être utilisé comme
source de vérité. Les proportions et la transparence des illustrations sont
conservées. Les fichiers de référence dans
`docs/design/skkup-dashboard-references/` restent inchangés, car ils servent à
la comparaison visuelle et ne sont pas des assets produits.

La correspondance entre ces illustrations et les routes des dashboards est
décrite dans [dashboard-icon-usage.md](dashboard-icon-usage.md). Ces dimensions
décrivent les fichiers du dépôt, pas les octets reçus par HTTP. Les pictogrammes
fonctionnels de navigation restent dans le registre `assets/ui-icons`; les
illustrations métier PNG sont candidates pour les soldes, récompenses, tickets,
série de visites et extension lorsque le composant dispose d'une surface
suffisante.

## Assets métier servis en production — 2026-10-25

Le contrôle initial du 2026-10-25 portait sur sept chemins: chacun répondait
alors en `200 image/png` sur
`https://skkup.fr/assets/dashboard/shared/icons/`. Les cinq assets encore
présents dans le checkout sont listés ci-dessous; leurs octets correspondaient
aux fichiers servis selon SHA-256 lors de ce contrôle. Les deux PNG supprimés
du dépôt peuvent encore être servis par la production jusqu'à son prochain
déploiement. Cette preuve historique établit la présence servie à cette date,
pas l'usage des fichiers dans les dashboards.

| Fichier | Octets servis | SHA-256 |
| --- | ---: | --- |
| `skkup-icon-extension-dashboard.png` | 1 421 807 | `98b65edbb21e9b59f0e9d2823b7ff850079e7006e75c2d1376f56e6865f30167` |
| `skkup-icon-points.png` | 1 702 838 | `24a670d71339bb3c98216fc55b4c710c65c7a33eff69b58f745470bd699e2886` |
| `skkup-icon-reward.png` | 1 842 051 | `157bb3056baab4b6fc505401d1ad09919886e0ac57d4b0451de55e8acd9a7abd` |
| `skkup-icon-streak.png` | 1 456 389 | `0d84537718e6f1e10bf5117c4fd9476bcec82639609b47db7f2c6a1ecb633fab` |
| `skkup-icon-ticket-s.png` | 1 571 510 | `d50e5ee5eea6e9a515ef971b281b7928054802a3fb4be120f3afbe1e938575ce` |

Le relevé initial de production incluait deux fichiers depuis supprimés
du dépôt après vérification: `skkup-icon-daily-visit.png` n'avait aucune
correspondance dans les composants ou usages UI, et `skkup-icon-scratch-card.png`
était identique octet pour octet à `skkup-icon-ticket-s.png` sans référence
runtime. Le premier n'a aucun emplacement métier dédié; le second ne constituait
pas une illustration de carte à gratter distincte. Ils ne font plus partie des
assets conservés dans le checkout. Ils peuvent rester disponibles sur la
production jusqu'au prochain déploiement.
