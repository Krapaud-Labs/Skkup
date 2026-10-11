# Requalification admin lots et niveau de stock

Date: 2026-10-11

## Changement

- HEAD produit: correction sémantique en cours après `0ec9ffc`.
- Route: `/admin/lots`.
- Correction: jauge visuelle dérivée de `lot.quantite`, avec états sain,
  faible et rupture, sans modifier le contrat API ni simuler un pourcentage
  métier.

## Preuves ciblées

- Tests admin et CSS: **25/25 PASS**.
- Playwright live post-commit: **4/4 PASS** aux viewports 320, 768 et 1280,
  plus paysage et zoom 200 %.
- Assertions: shell, HTTP, images accessibles, contrôles nommés, focus,
  reduced-motion et absence d'overflow.
- QA: PASS ciblé.
- Auditeur: PASS ciblé pour l'écart admin-lots.
- Frontend: PASS ciblé.
- QA: la preuve fraîche multi-breakpoint est **4/4 PASS** après la correction,
  sur 320, 768 et 1280 px, ainsi qu'en paysage et zoom 200 %.

## Réserve

La largeur visuelle n'utilise plus la convention `quantité × 10`. Les classes
sémantiques appliquent une barre pleine pour le stock disponible, une barre à
50 % pour le stock faible et une barre vide en rupture. La quantité exacte
reste affichée et annoncée. L'écart de richesse de la référence lots reste
ouvert car il dépend de champs absents du contrat API.
