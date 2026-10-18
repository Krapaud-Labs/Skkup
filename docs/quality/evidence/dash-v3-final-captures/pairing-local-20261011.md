---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Pairing extension, recette locale

## Preuve produite

- Build QA: `SKKUP_API_URL=https://localhost npm run build`
- Résultat: extension construite dans `extension/dist/` avec l’API locale HTTPS.
- Tests extension: 10 fichiers, 59 tests réussis.

## Limite conservée

Cette recette confirme que le paquet QA cible la même API locale que le
dashboard Docker. Elle ne ferme pas la case Chrome Web Store: l’installation
de la version publiée et la saisie réelle du code dans cette extension n’ont
pas été exécutées dans ce profil de contrôle. La checklist reste donc ouverte
jusqu’à cette preuve distincte.
