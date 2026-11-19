---
last_updated: 2026-11-19
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
| US-004 | P0 | En tant que viewer, je gagne des points. | Backend, heartbeats authentifiés, plafond journalier de 90 points. | Aucun doublon ni crédit après plafond. | tests ledger | accepted |
| US-005 | P0 | En tant que viewer, je suis mon streak. | Paliers 1, 3, 7, 14 et 30 jours; bonus attribué une seule fois par seuil; remise à zéro après un jour manqué; récompenses gagnées conservées. Les types et montants ne sont pas définis par le cahier accepté. | Solde et historique cohérents. | tests streak | accepted |
| US-006 | P0 | En tant qu'admin, je prépare un tirage manuel. | Préparation interne seulement avant validation juridique écrite du mécanisme et du règlement; ensuite liste figée, aléatoire sûr, audit. | Aucun tirage ni résultat publié publiquement sans validation juridique écrite préalable, puis contrôle et preuve d'audit. | Validation juridique préalable puis preuve admin liée au SHA | needs-review |
| US-007 | P1 | En tant qu'admin, j'examine un signal fraude. | Décision proportionnée et humaine; si le compte est suspendu, un admin peut le réactiver. Le statut du `FraudFlag` reste distinct de celui du compte. | Suspension du compte tracée et réversible par réactivation admin; le statut du signalement suit son propre cycle. | audit log | accepted |
| US-008 | MVP (cycle accepté par l'owner) | En tant qu'admin, je gère le cycle de vie d'une annonce afin de maîtriser sa diffusion aux viewers. | Une annonce est créée en `DRAFT`; seule une publication explicite la fait passer à `PUBLISHED`; l'archivage la place en `ARCHIVED`. Les viewers ne reçoivent que les annonces `PUBLISHED`. Le compteur et la lecture locale suivent ADR-011. | Créer en brouillon, publier explicitement, archiver/restaurer et vérifier la visibilité viewer limitée aux annonces publiées; vérifier aussi le refus des mutations admin par un viewer, conformément à la [conception du cycle](../design/announcement-lifecycle-2026-10-22.md). | Résultats QA ciblés, y compris le compteur `PUBLISHED`, et leurs limites sont synthétisés dans la [matrice P0, section US-008](../quality/p0-evidence-matrix.md#us-008-cycle-des-annonces). La story reste `needs-review` jusqu'à la revue/readiness globale. | needs-review |
| US-009 | MVP, périmètre accepté; baseline produit prudente mandatée le 2026-11-19 | En tant que viewer, je consulte mes récompenses garanties et les opérations disponibles. | Les points non achetables/non transférables servent uniquement aux récompenses garanties. La boutique ne vend aucun ticket ni chance. Tirages au sort et cartes à gratter restent désactivés publiquement jusqu'à validation juridique écrite du mécanisme et de son règlement. Une éventuelle participation gratuite par compte et par opération est une proposition conditionnelle, sans achat, points dépensés, abonnement payant ni visionnage obligatoire. | Séparer la boutique des jeux de hasard; aucune activation publique avant revue juridique; règles et preuves à publier avant toute participation. | Validation juridique ciblée avant activation, validation Data/Conformité, spécification, tests et preuves liées au SHA; statut `needs-review` jusqu'à ces preuves. | needs-review |
| US-010 | MVP, périmètre accepté; baseline produit mandatée le 2026-11-19 | En tant qu'admin, je gère les lots et les contenus éditoriaux dans le back-office. | Lots attribués par hasard : création en brouillon non visible publiquement, validation juridique écrite préalable, puis publication explicite par un admin habilité et transitions `DRAFT` → `PUBLISHED` → `CLOSED` → `DRAWN` → `ARCHIVED`, avec instantané des conditions. Contenus éditoriaux : `DRAFT` → publication explicite → `ARCHIVED`, avec versions. | Aucun lot de hasard visible publiquement avant validation écrite; toute anomalie bloque publication ou tirage; aucune mutation ne change rétroactivement les conditions; cycles lots et contenus distincts. | Validation juridique ciblée, contrats/parcours admin, provenance médias, permissions, audit log et preuve QA rattachée au SHA; statut `needs-review` jusqu'à vérification. | needs-review |
| US-011 | MVP, exigences de support acceptées; baseline produit mandatée le 2026-11-19 | En tant que gagnant, je reçois une notification privée dans les sept jours et peux contacter le support. | Le délai de notification part de la validation journalisée du tirage; le support répond sous quatorze jours à compter de la réception. Aucun identifiant personnel n'est publié par défaut; une publication facultative d'un pseudo requiert un choix distinct. La participation n'impose pas de consentement marketing. | Réclamation traitée en privé avec une référence d'opération; pseudo ré-identifiable traité comme donnée personnelle, jamais qualifié d'anonyme. | Parcours transactionnel et données validés par Data/Conformité; tests des délais et confidentialité liés au SHA livré; statut `needs-review` jusqu'à vérification. | needs-review |

## Couverture du périmètre accepté et inconnues

Les US-001 à US-008 ne couvraient pas explicitement les lots et contenus
éditoriaux, l'utilisation des tickets, ni le parcours du gagnant et du support.
Les US-009 à US-011 rétablissent cette traçabilité à partir du cahier accepté.
Leur baseline produit est désormais détaillée dans
[`readiness-decision-request.md`](../delivery/readiness-decision-request.md),
à la demande du propriétaire. Ces stories restent `needs-review` jusqu'aux
validations spécialisées et preuves d'implémentation. Les délais de sept et
quatorze jours proviennent du cahier accepté; le déclencheur, la procédure de
réclamation et la protection contre la divulgation publique ont été précisés.

## Scénarios d erreur et cas limites

| Référence | Situation | Comportement attendu | Message ou retour | Test associé |
| --- | --- | --- | --- | --- |
| ERR-AUTH | session invalide | refuser et demander reconnexion | session expirée | test auth |
| ERR-HEARTBEAT | cadence ou jeton invalide | ignorer sans crédit | activité non validée | test anti-fraude |
| ERR-LIMIT | plafond atteint | arrêter le crédit | plafond quotidien atteint | test plafond |

## Exigences non fonctionnelles liées

Interface responsive et clavier utilisable, API protégée et limitée, journaux sans secrets, extension sans cookies ni historique, compatibilité Chrome MVP, et calcul idempotent côté serveur.
