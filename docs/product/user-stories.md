---
last_updated: 2026-11-07
---

# User stories, règles métier et critères d acceptation

## Convention

Chaque story suit la forme : En tant que `<acteur>`, je veux `<action>`, afin de `<valeur>`. Les critères couvrent le succès, les validations, les erreurs, les permissions et les cas limites.

Dans la colonne Statut, `accepted` qualifie l'acceptation de la story et de ses
critères produit. Cela ne signifie ni que l'implémentation est terminée, ni que
les tests ou les preuves QA sont acceptés. Les statuts de validation sont
suivis séparément dans la [matrice P0](../quality/p0-evidence-matrix.md).

## Backlog priorisé

| ID | Priorité | User story | Règles métier | Critères d acceptation vérifiables | Tests ou preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | P0 | En tant que visiteur, je comprends le service. | Les règles et lots sont publics. | Vitrine, FAQ et légal accessibles. | test navigation | accepted |
| US-002 | P0 | En tant que viewer majeur, je crée un compte. | Email, pseudo, mot de passe haché, consentements. | Compte créé ou erreur explicite. | tests auth | accepted |
| US-003 | P0 | En tant que viewer, j'apparie l'extension. | Code court, jeton limité, un seul appareil actif à la fois par compte. Un nouvel appareil peut être associé après révocation ou expiration du précédent. | Appariement unique et révocable. | test extension | accepted |
| US-004 | P0 | En tant que viewer, je gagne des points. | Backend, heartbeats authentifiés, plafond 65. | Aucun doublon ni crédit après plafond. | tests ledger | accepted |
| US-005 | P0 | En tant que viewer, je suis mon streak. | Paliers 1, 3, 7, 14 et 30 jours; bonus attribué une seule fois par seuil; remise à zéro après un jour manqué; récompenses gagnées conservées. Les types et montants ne sont pas définis par le cahier accepté. | Solde et historique cohérents. | tests streak | accepted |
| US-006 | P0 | En tant qu'admin, je lance un tirage manuel. | Liste figée, aléatoire sûr, audit. | Publication uniquement après contrôle. | preuve admin | accepted |
| US-007 | P1 | En tant qu'admin, j'examine un signal fraude. | Décision proportionnée et humaine; si le compte est suspendu, un admin peut le réactiver. Le statut du `FraudFlag` reste distinct de celui du compte. | Suspension du compte tracée et réversible par réactivation admin; le statut du signalement suit son propre cycle. | audit log | accepted |
| US-008 | MVP (cycle accepté par l'owner) | En tant qu'admin, je gère le cycle de vie d'une annonce afin de maîtriser sa diffusion aux viewers. | Une annonce est créée en `DRAFT`; seule une publication explicite la fait passer à `PUBLISHED`; l'archivage la place en `ARCHIVED`. Les viewers ne reçoivent que les annonces `PUBLISHED`. Le compteur et la lecture locale suivent ADR-011. | Créer en brouillon, publier explicitement, archiver/restaurer et vérifier la visibilité viewer limitée aux annonces publiées; vérifier aussi le refus des mutations admin par un viewer, conformément à la [conception du cycle](../design/announcement-lifecycle-2026-10-22.md). | Résultats QA ciblés, y compris le compteur `PUBLISHED`, et leurs limites sont synthétisés dans la [matrice P0, section US-008](../quality/p0-evidence-matrix.md#us-008-cycle-des-annonces). La story reste `needs-review` jusqu'à la revue/readiness globale. | needs-review |
| US-009 | MVP, périmètre accepté | En tant que viewer, je consulte mes tickets et participe aux tirages disponibles. | Le cahier inclut tickets et tirages; il ne définit pas l'acquisition, le coût, l'éligibilité, la consommation ni les limites des tickets. Ne déduire aucune règle de ces inconnues. | Critères détaillés en attente des décisions métier sur l'obtention et l'utilisation des tickets; ne pas implémenter de comportement non défini. | Décision produit datée, puis scénarios de succès/refus et preuve QA du parcours selon la priorité décidée. | needs-review |
| US-010 | MVP, périmètre accepté | En tant qu'admin, je gère les lots et les contenus éditoriaux dans le back-office. | Le cahier inclut la gestion des lots et des contenus éditoriaux, sans préciser leurs champs, transitions, validation ou publication. | Critères détaillés en attente de la spécification du cycle de gestion; aucune transition n'est inférée. | Décision produit datée, contrats et parcours admin, puis preuve QA rattachée au SHA livré. | needs-review |
| US-011 | MVP, exigences de support acceptées | En tant que gagnant, je reçois une notification dans les sept jours et peux contacter le support par email. | Le support répond sous quatorze jours; le pseudo du gagnant est anonymisé. Le cahier ne précise pas le déclencheur exact, le contenu du message ni la procédure de réclamation. | Vérifier les délais de notification et de réponse, le canal email de support et l'anonymisation du pseudo; préciser séparément le déclencheur et le parcours de réclamation avant de les implémenter. | Décision produit sur le parcours, puis preuve de communication conforme aux délais. | needs-review |

## Couverture du périmètre accepté et inconnues

Les US-001 à US-008 ne couvraient pas explicitement les lots et contenus
éditoriaux, l'utilisation des tickets, ni le parcours du gagnant et du support.
Les US-009 à US-011 rétablissent cette traçabilité à partir du cahier accepté.
Ils ne ferment pas les décisions manquantes: l'obtention et la consommation des
tickets, les transitions des lots et contenus, et le déclencheur/procédure de
réclamation restent `needs-review`. Les délais de sept et quatorze jours et
l'anonymisation du pseudo, eux, proviennent du cahier et ne sont pas des choix
nouvellement introduits.

## Scénarios d erreur et cas limites

| Référence | Situation | Comportement attendu | Message ou retour | Test associé |
| --- | --- | --- | --- | --- |
| ERR-AUTH | session invalide | refuser et demander reconnexion | session expirée | test auth |
| ERR-HEARTBEAT | cadence ou jeton invalide | ignorer sans crédit | activité non validée | test anti-fraude |
| ERR-LIMIT | plafond atteint | arrêter le crédit | plafond quotidien atteint | test plafond |

## Exigences non fonctionnelles liées

Interface responsive et clavier utilisable, API protégée et limitée, journaux sans secrets, extension sans cookies ni historique, compatibilité Chrome MVP, et calcul idempotent côté serveur.
