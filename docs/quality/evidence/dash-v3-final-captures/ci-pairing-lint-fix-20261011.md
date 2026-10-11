# Correction CI du pairing extension

Date: 2026-10-11

## Diagnostic

Le run GitHub Actions `38136880691` a échoué uniquement sur le job Frontend.
Le lint React signalait `set-state-in-effect` dans `CodeAppariement.tsx` :
l'effet initial appelait directement une fonction qui réinitialisait un état.

## Correction

Le chargement initial utilise désormais une fonction sans mise à jour synchrone
d'état. La réinitialisation du message d'erreur reste réservée à l'action
explicite « Actualiser l'état ».

## Preuves locales

- ESLint: **0 erreur**, 2 avertissements historiques `no-img-element`.
- Tests pairing et extension: **8/8 PASS**.
- La CI doit être relue sur le nouveau HEAD avant toute livraison.
