---
last_updated: 2026-10-20
---
# User stories, règles métier et critères d acceptation

## Convention

Chaque story suit la forme : En tant que `<acteur>`, je veux `<action>`, afin de `<valeur>`. Les critères couvrent le succès, les validations, les erreurs, les permissions et les cas limites.

## Backlog priorisé

| ID | Priorité | User story | Règles métier | Critères d acceptation vérifiables | Tests ou preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | P0 | En tant que visiteur, je comprends le service. | Les règles et lots sont publics. | Vitrine, FAQ et légal accessibles. | test navigation | accepted |
| US-002 | P0 | En tant que viewer majeur, je crée un compte. | Email, pseudo, mot de passe haché, consentements. | Compte créé ou erreur explicite. | tests auth | accepted |
| US-003 | P0 | En tant que viewer, j'apparie l'extension. | Code court, jeton limité, cinq appareils max. | Appariement unique et révocable. | test extension | accepted |
| US-004 | P0 | En tant que viewer, je gagne des points. | Crédit backend sur heartbeats authentifiés et idempotents; un plafond chiffré, son barème et ses valeurs ne sont pas décidés pour le MVP. | Aucun doublon; le crédit suit une configuration explicitement approuvée. Aucun seuil historique, dont 65 points/jour, ne constitue une règle produit acceptée. | tests ledger; config approuvée à fournir avant activation d'une règle chiffrée | needs-review |
| US-005 | P0 | En tant que viewer, je suis mon streak. | Streak calculé côté serveur et reprise après jour manqué; seuils de cartes, valeurs/règles de récompense et fréquence d'octroi des tickets non décidés hors MVP. | Solde et historique cohérents; ne pas créer de récompense ou ticket selon les seuils historiques 3/7/14/30 ou « chaque dizaine après 30 » sans décision owner. | tests streak; valeurs approuvées requises avant activation des récompenses/tickets concernés | needs-review |
| US-006 | P0 | En tant qu'admin, je lance un tirage manuel. | Liste figée, aléatoire sûr, audit. | Publication uniquement après contrôle. | preuve admin | accepted |
| US-007 | P1 | En tant qu'admin, j'examine un signal fraude. | Décision proportionnée et humaine; si le compte est suspendu, un admin peut le réactiver. Le statut du `FraudFlag` reste distinct de celui du compte. | Suspension du compte tracée et réversible par réactivation admin; le statut du signalement suit son propre cycle. | audit log | accepted |

## Scénarios d erreur et cas limites

| Référence | Situation | Comportement attendu | Message ou retour | Test associé |
| --- | --- | --- | --- | --- |
| ERR-AUTH | session invalide | refuser et demander reconnexion | session expirée | test auth |
| ERR-HEARTBEAT | cadence ou jeton invalide | ignorer sans crédit | activité non validée | test anti-fraude |
| ERR-LIMIT | plafond atteint, si une limite approuvée est configurée pour une version future | appliquer la limite configurée sans crédit en double | message défini avec le produit | test de configuration; aucun montant par défaut n'est accepté par ce document |

## Exigences non fonctionnelles liées

Interface responsive et clavier utilisable, API protégée et limitée, journaux sans secrets, extension sans cookies ni historique, compatibilité Chrome MVP, et calcul idempotent côté serveur.
