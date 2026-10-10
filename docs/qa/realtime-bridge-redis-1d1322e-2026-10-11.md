# Reprise du bridge Redis temps réel

Commit : `1d1322e`

Le subscriber Redis du backend utilise une stratégie de reconnexion explicite,
bornée à 250 ms par tentative et plafonnée à 5 s. ioredis restaure
automatiquement l’abonnement au canal après reconnexion.

Validation :

- suite `realtime.bridge.spec.ts` : 7/7 PASS ;
- rebuild Docker backend : PASS ;
- handshake WSS via Traefik/backend : HTTP 101 ;
- le test Chromium local ferme encore l’upgrade avant établissement, donc la
  reconnexion navigateur après panne Redis reste ouverte et n’est pas déclarée
  PASS par extrapolation.
