---
last_updated: 2026-10-29
---

# Journal des décisions

| ID | Date | Décision | Contexte et options | Conséquence | Propriétaire | Révision |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-001 | 2026-09-25 | France au lancement | périmètre confirmé | conformité et support limités | Mickael MUR | avant production |
| ADR-002 | 2026-09-25 | 18 ans cible | option prudente pour lots réels | validation juridique requise | Mickael MUR | revue légale |
| ADR-003 | 2026-09-25 | MVP progressif | réduire le périmètre | V1.1 séparée | Mickael MUR | revue roadmap |
| ADR-004 | 2026-09-25 | tirage manuel admin | demande métier | audit et contrôle humain | Mickael MUR | règlement |
| ADR-005 | 2026-09-25 | streak par paliers | éviter multiplicateurs | simulations avant production | Mickael MUR | tests équilibre |
| ADR-006 | 2026-10-06 | conservation du compte : trois ans après la dernière connexion, sous réserve de confirmation conformité | valeur déjà publiée à l'article 9 du règlement; ne pas extrapoler cette durée aux autres catégories | relier la valeur à une purge testée; documenter séparément les autres catégories et exceptions légales | Mickael MUR / conformité | avant production |
| ADR-007 | 2026-10-06 | validation visuelle indépendante après correction documentaire | séparer conception, implémentation et audit | captures et rapport auditeur requis avant `review` | Coordinateur / auditeur | work item onboarding |
| ADR-008 | 2026-10-07 | readiness maintenue en rework | l'audit indépendant confirme que les preuves P0, exploitation et conformité ne sont pas complètes | aucune approbation de conception ni clôture d'audit avant décision de conformité, preuves préproduction et nouvelle relecture indépendante | Coordinateur / produit / conformité / ops | avant approbation |
| ADR-010 | 2026-10-09 | structure viewer prioritaire et données contractuelles uniquement pour DASH-V3 | la carte impose une même structure viewer pour l'admin; plusieurs références contiennent des champs non présents dans les contrats API | aucune donnée fictive, aucun statut ou média inventé; chaque écran doit prouver ses états loading/vide/erreur/succès, son responsive et ses permissions avant livraison | produit / conception / QA / auditeur | avant PR finale |
| ADR-012 | 2026-10-29 | retrait de l’écran Historique du dashboard viewer | demande explicite du propriétaire; les activités récentes sont déjà sur l’accueil | retirer les liens viewer, rediriger `/dashboard/historique` vers `/dashboard#history`, garder les cinq activités récentes et conserver l’API, les données et les historiques admin; l’historique complet n’est plus accessible dans l’interface viewer | Mickael MUR | si l’activité récente du dashboard évolue |

## ADR-009 - Baseline produit initiale (2026-10-08)

Date : 2026-10-08

À cette date, le propriétaire du projet valide les orientations produit
réversibles de rétention, droits, provenance média et exploitation alors
consignées dans `readiness-decision-request.md`. Les décisions owner ultérieures
priment pour leur périmètre. En particulier, les exercices d'exploitation
propres au staging sont suivis après MVP dans l'issue #422 et ne sont pas réputés
exécutés.

Cette décision historique ne vaut ni approbation de conception ni clôture
d'audit. Elle ne constitue pas une validation conformité ou juridique, ne
fournit pas de justificatifs de droits par ressource et ne prouve ni exécution
ni readiness.
