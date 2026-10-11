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
---
last_updated: 2026-10-09
---
# ADR-009 - Baseline readiness validée

Date : 2026-10-08

Le propriétaire du projet valide la baseline réversible de rétention, droits,
provenance média et exploitation décrite dans `readiness-decision-request.md`.
Cette décision ne vaut ni approbation de conception ni clôture d'audit; elle
autorise la nouvelle relecture indépendante.
