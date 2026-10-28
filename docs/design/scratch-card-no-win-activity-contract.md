# Contrat ciblé : activité des cartes sans gain

## Portée

Cette exception, demandée par le propriétaire et relue par l'Auditeur, est
limitée au résultat `RIEN` d'une carte à gratter. Elle ne
change pas le statut global de `docs/design/design-readiness.md` et n'approuve
aucune autre partie de la conception.

## Comportement attendu

- La validation finale marque la carte comme grattée et ajoute dans la même
  transaction de base une activité `CARTE_A_GRATTER` dont `montant` vaut `0`.
- Le solde de points ne change pas.
- Aucune notification de crédit de points n'est émise.
- Le résultat est visible dans l'activité récente avec le rendu neutre zéro
  point déjà pris en charge par le dashboard.
- L'opération reste idempotente grâce à la mise à jour conditionnelle de la
  carte; une carte grattée ne peut pas créer un second événement.

## Vérification

Le test backend doit vérifier l'événement zéro, l'absence de mise à jour du
solde et l'absence de notification. La vérification API/DB et du rendu du
dashboard est confiée à QA sur l'environnement Docker isolé.
