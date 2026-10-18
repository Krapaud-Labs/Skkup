---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Relecture d'état du pairing extension

Date: 2026-10-11

## Correction

`/dashboard/extension` expose désormais une action explicite « Actualiser
l'état ». Elle relit `GET /extension/pairings` après l'association réalisée
dans l'extension, sans exposer ni mémoriser le jeton de l'extension.

## Preuves

- Tests ciblés frontend: **8/8 PASS**.
- Le test couvre la transition état vide vers appareil `ACTIF` après relecture.
- Le pairing local Docker reste prouvé côté API: génération `201`, échange
  `200`, persistance, révocation `204` et expiration contrôlée.

## Limite

L'association avec le paquet réellement publié sur le Chrome Web Store vers
l'API distante reste à prouver séparément. Ce correctif ferme uniquement le
rafraîchissement côté dashboard, sans simuler cette preuve externe.
