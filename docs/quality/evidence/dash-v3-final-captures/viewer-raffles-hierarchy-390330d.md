---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Requalification viewer tirages

Date: 2026-10-11

## Changement

- HEAD produit: `390330d`.
- Route: `/dashboard/tirages`.
- Correction: hiérarchie renforcée pour titre, métadonnées, lots/prix et résumé
  du panneau détail, sans changement d'API.

## Preuves ciblées

- Tests unitaires et CSS: **9/9 PASS**.
- Playwright live post-commit: **4/4 PASS**.
- Viewports: 320, 768, 1280, paysage et zoom 200 %.
- Assertions: shell réel, HTTP valide, images accessibles, contrôles nommés,
  focus, reduced-motion et aucune largeur horizontale.
- QA: PASS ciblé.
- Auditeur: PASS ciblé pour l'écart viewer-tirages.

## Limites

Frontend maintient `NEEDS-REVIEW` pour la fidélité stricte, car la référence
contient davantage de données et de médias que le contrat actuel. Cette
correction traite la hiérarchie sans inventer ces données et ne ferme pas le
design-gate global.
