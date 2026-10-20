---
last_updated: 2026-10-20
---
# Décision produit ACT-11 — valeurs non arrêtées

- Date de décision : 2026-10-18
- Statut : décision de report confirmée; les valeurs métier restent à arrêter.
- Portée : règles et plafonds de points, récompenses, probabilités, prix et
  calendrier des tirages/récompenses non décidés.

## Décision owner

> Reporter les valeurs non décidées hors MVP tant que les owners ne les ont pas
> décidées.

Cette décision provient de la réponse explicite du responsable du projet au
cadrage ACT-11 du 2026-10-18. La phrase ci-dessus en conserve le sens exact;
aucune identité d'owner métier supplémentaire ni valeur chiffrée n'est supposée.

## Conséquences

- Les seuils, montants, prix, probabilités et calendriers des anciens brouillons
  ne sont pas des critères d'acceptation actuels.
- Les fonctionnalités qui exigent ces valeurs ne deviennent pas implicitement
  des engagements MVP; chaque owner concerné doit décider leur périmètre et
  leurs règles avant leur inclusion.
- US-004 et US-005 restent `needs-review` pour les règles et valeurs non
  arrêtées. Le code existant doit être réconcilié après la gate de conception.
- Cette décision ne remplace pas les validations juridiques ou Conformité, et
  n'approuve ni la conception globale ni la clôture de MVP-001.

## Traçabilité

- [User stories](user-stories.md#us-004)
- [Vision et périmètre](vision-and-scope.md)
- [Premier jet fonctionnel historique](../01-features.md)
- [Contrat API et limites de périmètre](../04-api-contract.md)
- [Matrice exigences/preuves](../design/mvp001-requirements-evidence-matrix.md#act-11--mentions-à-vérifier-ou-définir)
