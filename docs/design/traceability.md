# Matrice de traçabilité

Cette matrice relie le besoin accepté aux stories, parcours, composants, contrats, données, contrôles de sécurité et preuves locales. Une référence de test prouve l'existence d'un contrôle technique; elle ne remplace pas une validation métier, juridique, visuelle ou de préproduction.

| Périmètre | Vision / règle | Story | Parcours | Architecture / données | Contrat ou contrôle | Preuve locale | État |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accès public | service, règles et lots compréhensibles | US-001 | visiteur et consultation du règlement | frontend, `ManagedContent` | pages publiques et contenu légal | `frontend/src/app/page.test.tsx`, `frontend/src/content/reglement.test.ts` | technique vérifié; contenu légal à relire |
| Compte | compte viewer majeur et session sécurisée | US-002 | inscription, connexion, déconnexion | `AuthController`, `User`, cookie session | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | tests auth et formulaire | technique vérifié; conformité à confirmer |
| Appariement | extension limitée et révocable | US-003 | génération, saisie, révocation | `ExtensionPairingToken`, `ExtensionPairing` | `/extension/pairing-token`, `/extension/pair`, `DELETE /extension/pairings/:id` | tests extension backend/frontend | technique vérifié |
| Visionnage et points | activité authentifiée, plafond et idempotence | US-004 | ouverture, heartbeat, fermeture | `WatchSession`, `PointsTransaction`, Redis/BullMQ | `/watch-sessions`, `/watch-sessions/:id/heartbeat`, `/watch-sessions/:id/close` | tests watch-session, realtime et extension | technique vérifié; charge à mesurer |
| Streak | paliers et remise à zéro | US-005 | consultation dashboard et check-in | `User.streakActuel`, `User.derniereVisiteAt` | `/me`, `/me/daily-checkin`, `/me/points/history` | tests service, dashboard et barre streak | technique vérifié |
| Tirage | liste figée, tirage auditable, publication | US-006 | participation, tirage admin, résultat | `Raffle`, `RaffleTicket`, `RaffleWinner`, `RaffleDrawAudit` | `/admin/raffles/:id/draw`, `/raffles/:id/result` | tests raffle et page admin | technique vérifié; validation métier à confirmer |
| Fraude | signal proportionné et examen humain | US-007 | signal, examen, suspension ou réexamen | `FraudFlag`, `ContentAuditEvent` | `/admin/fraud/flags`, patch admin | tests fraud et admin guard | technique vérifié; procédure humaine à valider |

## Limites de la preuve

- Les tests locaux ne prouvent pas les SLO, la restauration de sauvegarde, la conformité juridique, la provenance des médias ni l'audit préproduction.
- Les contrats API doivent encore recevoir une matrice exhaustive des codes d'erreur et de compatibilité.
- Les points restant ouverts sont suivis dans `docs/design/design-readiness.md` et `docs/delivery/decision-log.md`.

---
last_updated: 2026-10-03
---
