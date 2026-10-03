# User stories, règles métier et critères d acceptation

## Convention

Chaque story suit la forme : En tant que `<acteur>`, je veux `<action>`, afin de `<valeur>`. Les critères couvrent le succès, les validations, les erreurs, les permissions et les cas limites.

## Backlog priorisé

| ID | Priorité | User story | Règles métier | Critères d acceptation vérifiables | Tests ou preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | P0 | En tant que visiteur, je comprends le service. | Les règles et lots sont publics. | Vitrine, FAQ et légal accessibles. | `frontend/src/app/page.test.tsx`, `frontend/src/content/reglement.test.ts` | accepted |
| US-002 | P0 | En tant que viewer majeur, je crée un compte. | Email, pseudo, mot de passe haché, consentements. | Compte créé ou erreur explicite. | `backend/src/auth/auth.controller.spec.ts`, `backend/src/auth/auth.service.spec.ts`, `frontend/src/components/auth/FormulaireAuth.test.tsx` | accepted |
| US-003 | P0 | En tant que viewer, j'apparie l'extension. | Code court, jeton limité, cinq appareils max. | Appariement unique et révocable. | `backend/src/extension/extension.service.spec.ts`, `backend/src/extension/jetons-extension.spec.ts`, `extension/src/popup/code-appariement.test.ts`, `frontend/src/components/extension/CodeAppariement.test.tsx` | accepted |
| US-004 | P0 | En tant que viewer, je gagne des points. | Backend, heartbeats authentifiés, plafond 65. | Aucun doublon ni crédit après plafond. | `backend/src/watch-sessions/watch-sessions.service.spec.ts`, `backend/src/realtime/realtime.service.spec.ts`, `frontend/src/lib/watch-sessions.test.ts` | accepted |
| US-005 | P0 | En tant que viewer, je suis mon streak. | Paliers 1, 3, 7, 14, 30 ; reset après jour manqué. | Solde et historique cohérents. | `backend/src/me/me.service.spec.ts`, `frontend/src/components/ui/BarreProgressionStreak.test.tsx`, `frontend/src/components/dashboard/TableauDeBord.test.tsx` | accepted |
| US-006 | P0 | En tant qu'admin, je lance un tirage manuel. | Liste figée, aléatoire sûr, audit. | Publication uniquement après contrôle. | `backend/src/raffles/raffles.service.spec.ts`, `backend/src/raffles/raffle-draw.spec.ts`, `backend/src/raffles/raffles.controller.spec.ts`, `frontend/src/app/admin/page.test.tsx` | accepted |
| US-007 | P1 | En tant qu'admin, j'examine un signal fraude. | Décision proportionnée et humaine. | Suspension tracée et réversible. | audit log | accepted |

## Scénarios d erreur et cas limites

| Référence | Situation | Comportement attendu | Message ou retour | Test associé |
| --- | --- | --- | --- | --- |
| ERR-AUTH | session invalide | refuser et demander reconnexion | session expirée | `backend/src/auth/guards/admin.guard.spec.ts`, `frontend/src/lib/auth.test.ts` |
| ERR-HEARTBEAT | cadence ou jeton invalide | ignorer sans crédit | activité non validée | `backend/src/watch-sessions/watch-session-credential.guard.spec.ts`, `extension/src/commun/cadence.test.ts` |
| ERR-LIMIT | plafond atteint | arrêter le crédit | plafond quotidien atteint | `backend/src/watch-sessions/watch-sessions.service.spec.ts`, `backend/src/realtime/realtime.service.spec.ts` |

## Exigences non fonctionnelles liées

Interface responsive et clavier utilisable, API protégée et limitée, journaux sans secrets, extension sans cookies ni historique, compatibilité Chrome MVP, et calcul idempotent côté serveur.
---
last_updated: 2026-09-25
---
