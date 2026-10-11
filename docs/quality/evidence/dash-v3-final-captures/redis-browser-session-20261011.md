# Recette ciblée Redis et session navigateur

Date: 2026-10-11

## Scénario

- Page publique `https://localhost/` qui initialise réellement la socket
  Socket.IO.
- Socket observée avant la coupure: `wss://localhost/socket.io/`, transport
  `websocket`.
- Redis arrêté avec `docker stop skkup-redis-1`, puis relancé avec
  `docker start skkup-redis-1`.
- Observation maintenue 15 secondes après le redémarrage.

## Résultat

- `connect=1` à `492 ms`.
- Arrêt Redis à `6470 ms`.
- Redémarrage Redis à `14589 ms`.
- Fin d'observation à `29590 ms`.
- `disconnect=0`.
- Aucun second événement `connect` observé.

## Verdict

Le transport navigateur est bien établi avant la coupure et reste ouvert
pendant ce scénario. Cette preuve valide l'absence d'interruption observable,
mais ne démontre pas une reconnexion après fermeture de la socket. Le verdict
reste donc `NEEDS-REVIEW` pour l'exigence de reconnexion explicite.

Cette distinction évite de rejouer le même contrôle ou de transformer une
absence de coupure en preuve de reconnexion.
