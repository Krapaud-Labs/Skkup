# Requalification admin lots et niveau de stock

Date: 2026-10-11

## Changement

- HEAD produit: `0ec9ffc`.
- Route: `/admin/lots`.
- Correction: jauge visuelle dérivée de `lot.quantite`, avec états sain,
  faible et rupture, sans modifier le contrat API.

## Preuves ciblées

- Tests admin et CSS: **25/25 PASS**.
- Playwright live post-commit: **4/4 PASS** aux viewports 320, 768 et 1280,
  plus paysage et zoom 200 %.
- Assertions: shell, HTTP, images accessibles, contrôles nommés, focus,
  reduced-motion et absence d'overflow.
- QA: PASS ciblé.
- Auditeur: PASS ciblé pour l'écart admin-lots.

## Réserve

La largeur visuelle utilise la convention UI `quantité × 10`, plafonnée à
100 %. Elle représente une intensité relative et ne prétend pas être un taux
de remplissage métier. Frontend conserve donc `NEEDS-REVIEW` strict pour cette
convention et pour les autres écarts de richesse de la référence lots.
