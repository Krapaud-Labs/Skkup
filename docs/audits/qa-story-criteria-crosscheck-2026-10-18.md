# Revue documentaire QA des critères par story - 2026-10-18

## Portée et méthode

Cette revue croise les critères de `docs/product/user-stories.md`, les
exécutions consignées dans `docs/quality/p0-evidence-matrix.md`, le relevé
ACT-06 du registre `docs/design/design-traceability-and-open-actions-2026-10-18.md`
et les specs source citées ci-dessous. Elle distingue la présence d'une spec,
un résultat historique, une exécution fraîche rapportée pour le 2026-10-18 et
les critères sans assertion correspondante. Aucun test n'a été exécuté pour
cette revue, aucun service n'a été démarré et aucun fichier source n'a été
modifié. Ce rapport est une revue documentaire, pas une validation
d'exécution. Le statut backlog des stories reste `accepted`; la couverture
QA/readiness décrite ici reste `needs-review`.

## Résultats par story

### US-001 - vitrine, FAQ et légal

Critère source : `docs/product/user-stories.md:11` demande que vitrine, FAQ et
légal soient accessibles, avec règles et lots publics. La spec
`frontend/src/app/page.test.tsx:5-14` vérifie le titre de la vitrine et son
lien vers la connexion, pas la FAQ ni l'accès aux pages légales. La spec
`frontend/src/components/legal/ReglementPublicContent.test.tsx:13-29`
vérifie le titre/région et le règlement de secours. La matrice
`docs/quality/p0-evidence-matrix.md:80` rapporte des exécutions fraîches le
2026-10-18 : page 1/1 et règlement 2/2 sous Vitest/jsdom. Elle indique aussi
que le rendu navigateur et la validation légale ne sont pas établis.

La campagne E2E historique citée par
`docs/quality/p0-evidence-matrix.md:14` n'est pas un résultat frais. Aucun cas
documenté ne couvre explicitement l'accessibilité de la FAQ, chaque lien
légal, ou la complétude publique des règles et lots. Prochaine preuve : QA,
cas explicites de navigation vitrine/FAQ/légal puis parcours navigateur
autorisé; validation éditoriale/juridique par les owners concernés.

### US-002 - création de compte ou erreur explicite

Critères source : `docs/product/user-stories.md:12` exige email, pseudo,
mot de passe haché, consentements, puis compte créé ou erreur explicite.
`frontend/src/components/auth/FormulaireAuth.test.tsx` contient des cas de
soumission, consentement, erreurs de connexion et réseau, refus du règlement,
confirmation et contraintes du mot de passe (`:77-112`, `:115-238`). La
matrice rapporte pour le 2026-10-18 11/11 tests frontend et le DTO 1/1
(`docs/quality/p0-evidence-matrix.md:81`). Le DTO
`backend/src/auth/dto/register.dto.spec.ts:4-19` teste des mots de passe
valides/invalides. Les specs présentes
`backend/src/auth/auth.service.spec.ts:67-133` couvrent notamment
consentement refusé, conflit d'unicité, erreur interne, hachage et création;
elles ne sont pas rapportées comme nouvellement exécutées le 2026-10-18.

La matrice consigne que `auth.controller.spec.ts` n'a exécuté aucun test le
2026-10-18, faute de client Prisma (`docs/quality/p0-evidence-matrix.md:81`).
Les mocks frontend ne prouvent pas le parcours HTTP ni la création backend.
Prochaine preuve : Backend + QA, exécution du contrôleur/service et parcours
d'intégration couvrant succès et erreurs après disponibilité des prérequis.

### US-003 - appariement unique et révocable

Critères source : `docs/product/user-stories.md:13` demande code court, jeton
limité, cinq appareils maximum, appariement unique et révocable. La spec
frontend `frontend/src/components/extension/CodeAppariement.test.tsx:53-213`
contient génération/expiration, liste/révocation simulée, actualisation,
erreurs 401/429 et localisation. Les specs backend présentes
`backend/src/extension/extension.service.spec.ts:90-331` couvrent code
consommé, expiré, inconnu, format invalide, plafond et révocation; la garde
`backend/src/extension/extension-auth.guard.spec.ts:34-89` couvre jetons
révoqué/expiré/inconnu et credentials absents/incorrects. La spec
`backend/src/extension/jetons-extension.spec.ts:9-61` couvre alphabet,
normalisation, jeton et empreinte.

Résultats frais rapportés : frontend 10/10 et 11 tests backend de jetons
réussis le 2026-10-18. La même commande backend a échoué avant exécution des
tests service et guard faute de client Prisma
(`docs/quality/p0-evidence-matrix.md:16,82`). Ces cas sont donc présents mais
non fraîchement exécutés selon les preuves disponibles; aucun E2E d'extension,
échange HTTP ni expiration/révocation persistée n'est prouvé. Prochaine preuve :
Backend + QA, exécuter service/guard puis documenter le parcours intégré
autorisé.

### US-004 - heartbeats authentifiés, absence de doublon et plafond

Critère source : `docs/product/user-stories.md:14` exige backend, heartbeats
authentifiés, plafond 65, aucun doublon et aucun crédit après plafond. La spec
client `frontend/src/lib/watch-sessions.test.ts:17-55` couvre construction des
requêtes HTTP simulées et normalisation. La spec hook
`frontend/src/hooks/useSessionVisionnage.test.tsx:55-190` est bien présente :
ouverture/heartbeat/clôture (`:58-90`), session 401/redirection (`:92-112`),
arrêt après invalidation 403 (`:114-141`), pause/reprise (`:143-176`) et
changement de chaîne (`:180-190`). Sa présence ne prouve pas une exécution
fraîche; aucun résultat frais de cette spec hook n'est établi dans la matrice.

Le relevé ACT-06 affirme à tort qu'« Aucun test `useSessionVisionnage` n'a été
inventorié » (`docs/design/design-traceability-and-open-actions-2026-10-18.md:319`).
Il devrait distinguer spec présente et exécution fraîche non établie. La matrice
rapporte le test client frais 3/3 et les suites backend service/guard non
chargées faute de Prisma (`docs/quality/p0-evidence-matrix.md:17,83`). La spec
backend `backend/src/watch-sessions/watch-sessions.service.spec.ts:181-453`
contient refus de session absente/étrangère/terminée, cadence, concurrence et
plafond (notamment `:245-267`, `:356-373`), mais ces assertions ne constituent
pas un run frais dans cette revue documentaire. Prochaine preuve : QA, corriger
le classement documentaire de la spec hook; Backend + QA, résultat frais des
tests backend puis preuve d'intégration pour idempotence et plafond.

### US-005 - streak, cartes, tickets, solde et historique

Critères source : `docs/product/user-stories.md:15` demande cartes aux seuils
3/7/14/30, un ticket à chaque dizaine après 30, reset après jour manqué et
cohérence solde/historique. La logique est déclarée dans
`backend/src/me/me.service.ts:16-23` et appliquée aux lignes `:387-395`.
La spec backend `backend/src/me/me.service.spec.ts:340-449` couvre première
visite, absence de carte à streak 1 et 2, incrément consécutif, reset après
jour manqué et double check-in. Elle ne contient aucune assertion vérifiant
la création de carte aux seuils 3, 7, 14 ou 30, ni de ticket à 40/50/etc.
Les fixtures de dashboard/résumé ne sont pas des assertions de seuil de
check-in. Le résultat frais rapporté est seulement le test UI historique
4/4 (`docs/quality/p0-evidence-matrix.md:18,84`); aucune exécution fraîche
backend n'est établie ici.

Prochaine preuve : Backend + QA, cas de check-in qui assertent explicitement
chaque récompense demandée et la cohérence ledger/solde/historique, puis
consignation d'un résultat frais.

### US-006 - tirage manuel, contrôle et audit

Critère source : `docs/product/user-stories.md:16` demande liste figée,
aléatoire sûr, audit et publication uniquement après contrôle. Les specs
`backend/src/raffles/tirage.spec.ts:13-145` couvrent reproductibilité,
unicité des gagnants, quantités, empreinte et graine. La spec exécuteur
`backend/src/raffles/raffle-draw.spec.ts:59-202` couvre transaction, empreinte,
détection d'ajout de ticket, double tirage et publication. Les specs
`backend/src/raffles/raffles.service.spec.ts:52-190` couvrent lecture du
résultat, exposition de l'audit et refus de publier avant le tirage. Le
composant admin `frontend/src/components/admin/RafflesAdminV3.test.tsx:31-76`
utilise des mocks et couvre succès UI et refus 403 simulé.

Résultats frais rapportés : frontend 24/24 et exécuteur backend 16 tests le
2026-10-18; trois suites backend n'ont pas démarré faute de client Prisma
(`docs/quality/p0-evidence-matrix.md:19,85`). La preuve documentée n'établit
pas la route admin/permission intégrée ni le contrôle préalable à la
publication sur HTTP réel. Prochaine preuve : Backend + QA, exécuter controller
et service avec leurs prérequis puis prouver route admin → contrôle → mutation
et audit.

### US-007 - signalement fraude et suspension réversible (P1)

Critère source : `docs/product/user-stories.md:17` formule « Suspension tracée
et réversible », sans préciser si la réversibilité concerne le signalement ou
le compte suspendu. Les routes et modèles sont distincts :
`backend/src/fraud-flags/fraud-flags.controller.ts:19-45` et
`backend/src/fraud-flags/fraud-flags.service.ts:45-64` traitent le statut
`FraudFlag` et l'audit associé; `backend/src/admin-users/admin-users.controller.ts:16-39`
et `backend/src/admin-users/admin-users.service.ts:67-94` traitent l'activation
du compte, la révocation de session à la désactivation et l'audit
`USER_ACTIVATED`/`USER_DEACTIVATED`.

Les tests présents `backend/src/fraud-flags/fraud-flags.service.spec.ts:18-31`
ne vérifient que le filtrage et le refus si le signalement est absent.
`backend/src/admin-users/admin-users.service.spec.ts:15-44` vérifie
l'interdiction d'auto-désactivation et la désactivation auditée; aucun test de
réactivation n'y figure. Les composants frontend ont un cas 403 simulé. La
matrice rapporte cinq tests frontend frais, tandis que les tests backend n'ont
pas démarré faute de Prisma (`docs/design/design-traceability-and-open-actions-2026-10-18.md:334-342`).

Prochaine étape : Produit + Backend + QA clarifient la portée de
« réversible »; ensuite, preuve de réactivation du compte si c'est le sens
retenu, ou de transition retour du `FraudFlag`, avec audit et exécution
fraîche. US-007 est P1, hors matrice P0.

## Scénarios d'erreur du backlog

### ERR-AUTH

Le comportement attendu est refus et reconnexion (« session expirée »),
`docs/product/user-stories.md:23`. Des cas auth sont présents, et la spec hook
US-004 couvre une ouverture de session 401 et redirection
(`frontend/src/hooks/useSessionVisionnage.test.tsx:92-112`). La matrice
documente des erreurs simulées frontend et un résultat historique du
contrôleur, mais aucun résultat frais de bout en bout pour cette erreur
(`docs/quality/p0-evidence-matrix.md:15,81`). Prochaine preuve : QA + Backend,
cas intégré frais de session invalide et réponse observable.

### ERR-HEARTBEAT

Le contrat écrit est « cadence ou jeton invalide : ignorer sans crédit » avec
retour « activité non validée » (`docs/product/user-stories.md:24`). En
revanche, la spec backend
`backend/src/watch-sessions/watch-sessions.service.spec.ts:245-267` vérifie
que lecture en pause et intervalle non plausible rejettent par
`BadRequestException`; elle n'assert ni une activité ignorée, ni le texte de
retour attendu. Un refus peut empêcher le crédit, mais la sémantique et le
retour ne sont pas démontrés équivalents. Les tests de garde de credentials
présents dans `backend/src/watch-sessions/watch-session-credential.guard.spec.ts:20-92`
couvrent le routage/refus des guards simulés, pas un heartbeat HTTP avec jeton
invalide. La matrice rapporte les suites backend non exécutées fraîchement
faute du client Prisma (`docs/quality/p0-evidence-matrix.md:17,83`).

Prochaine preuve : Produit + Backend + QA précisent si le contrat signifie
réponse métier ignorée ou rejet HTTP; ensuite, assertion explicite du statut,
payload/message et absence de crédit, avec exécution backend fraîche.

### ERR-LIMIT

Le backlog demande arrêt du crédit et retour « plafond quotidien atteint »
(`docs/product/user-stories.md:25`). Une spec backend présente vérifie zéro
crédit et aucune transaction supplémentaire au plafond
(`backend/src/watch-sessions/watch-sessions.service.spec.ts:356-373`). La
matrice ne rapporte pas d'exécution fraîche de cette spec backend
(`docs/quality/p0-evidence-matrix.md:17,83`). Prochaine preuve : Backend + QA,
résultat frais et vérification du retour visible/API attendu.

## État documentaire

Les résultats « frais » ci-dessus sont uniquement ceux explicitement
consignés dans la matrice et le relevé ACT-06 pour le 2026-10-18. Les specs
non accompagnées d'un résultat sont indiquées comme présentes, pas comme
exécutées. Les campagnes archivées des 2026-10-07/08/10 restent historiques.
Le statut backlog des stories reste `accepted`; la couverture QA/readiness
décrite ici reste `needs-review`. Ce document n'approuve ni les critères
métier ni la readiness produit.
