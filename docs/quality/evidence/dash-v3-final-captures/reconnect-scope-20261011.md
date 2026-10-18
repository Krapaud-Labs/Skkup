---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Périmètre de preuve reconnexion temps réel

Date: 2026-10-11

## Résultat consolidé

La preuve existante dans `addendum-audit-independant-seconde-passe-2026-10-10.md`
observe une reconnexion Socket.IO après redémarrage du backend (`connected=2`,
`disconnected=1`, `reconnectObserved=true`). Elle est réutilisée et ne sera pas
rejouée.

Elle ne couvre pas une coupure Redis avec une socket navigateur active. Les
campagnes précédentes ont soit observé une socket fermée avant la coupure, soit
une route sans transport WebSocket établi. Elles restent donc insuffisantes
pour cette exigence précise.

## Verdict

`NEEDS-REVIEW` uniquement pour la reconnexion navigateur après incident Redis.
La stratégie de reprise du bridge Redis et les tests ciblés `7/7` restent
valides. Aucun nouveau test identique n'est autorisé tant qu'une session
navigateur authentifiée n'établit pas effectivement le transport avant la
coupure.

## Prochaine preuve unique

Utiliser une route qui appelle réellement `connecterTempsReel`, vérifier un
événement `connect` avant l'arrêt Redis, arrêter puis redémarrer Redis et
archiver `disconnect` puis un nouvel événement `connect` dans la même session.
