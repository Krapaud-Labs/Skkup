---
last_updated: 2026-11-19
---

# Index documentaire Skkup

## Sources canoniques

| Sujet | Référence active | Limite de lecture |
| --- | --- | --- |
| Vision et périmètre produit | [Vision, objectifs et périmètre](product/vision-and-scope.md) | Décisions produit et limites de périmètre; le cahier MVP initial reste inchangé. |
| Cahier accepté | [Cahier des charges MVP](project-management/cahier-des-charges/Skkup/PROJECT-BRIEF.md) | Copie fidèle du contenu accepté; provenance de pièce jointe locale retirée. |
| Spécification fonctionnelle V1 | [01. Spécifications fonctionnelles](01-features.md) | Règles fonctionnelles et périmètre V1. |
| Architecture cible et décisions techniques | [02. Architecture](02-architecture.md) | Architecture cible et ADR; les audits opérationnels datés restent des preuves historiques. |
| Frontière NestJS Auth/Realtime | [ADR-017](design/adr-017-auth-realtime-module-boundary.md) | Proposition approuvée par le responsable produit; le gate global reste `review` et l'implémentation structurelle n'est pas autorisée par cette approbation seule. Un E2E Redis 1/1 confirme la propagation générique d'une déconnexion de room entre deux serveurs Socket.IO dans le même processus, sans prouver le câblage Nest/Auth ni le déploiement. |
| Exploitation et preuves Ops | [Audit d'exploitation ACT-02](design/ops-audit-2026-10-18.md) | Réglages et cadences définis par le code, observations datées et lacunes d'exploitation sont distingués; ne prouve ni l'état runtime actuel, ni l'alerting, ni la readiness. |
| Modèle de données courant | [03. Modèle de données](03-data-model.md) | À lire avec le schéma actuel `backend/prisma/schema.prisma`; ACT-03 consigne notamment `AuthSession` et la purge technique au-delà de 7 jours, sans en faire une politique légale de conservation ou une preuve d'exécution production. |
| Routes et contrats HTTP | [04. Contrat API](04-api-contract.md), [audit des contrats API](design/api-contract-audit-2026-10-18.md) et [ADR-020](delivery/decision-log.md) | Le résumé personnel est accessible à `VIEWER` et `ADMIN` sur leur propre identité; l’E2E HTTP `announcements-viewer` passe 1/7 au SHA `8431aa7d` pour les gardes, DTO et curseur avec Prisma/AnnouncementsService mockés, sans prouver cycle DB, expiration ou modal; la suite HTTP API-004 a passé 3/3 (401 anonyme, 200 Viewer/Admin) avec agrégateur mocké; cette décision n'élargit pas les routes admin. Les E2E HTTP/PostgreSQL heartbeat et tirage admin ont passé respectivement 2/2 et 3/3 au HEAD code `fae60bd` (12 migrations chacun); les runs `d3679cac` restent historiques. Le quota `429` heartbeat est vérifié en run isolé (application Nest et store neufs): quatre DTO invalides authentifiés donnent `400`, puis le cinquième appel donne `429`; le `429` tirage est vérifié en single-process. Le tirage teste aussi un échec d'audit synthétique avec rollback; les modes de production/multi-instance restent à valider. L’audit distingue comportement courant, assertions historiques, tests ciblés et lacunes. Il ne vaut pas approbation de readiness; ACT-04/11 restent `needs-review`. |
| Menaces et contrôles de sécurité | [05. Sécurité](05-security.md) | Baseline technique; ne vaut pas validation juridique ou audit indépendant actuel. |
| Stories et critères d’acceptation | [User stories](product/user-stories.md) | Critères par parcours; US-004 reprend le plafond de 90 points; US-007 a une preuve HTTP/PostgreSQL isolée de désactivation/réactivation admin 2/2, limitée aux assertions et sans run CI au SHA de livraison; la baseline US-009..011 réserve la boutique aux récompenses garanties et bloque l’activation publique des jeux de hasard jusqu’à validation juridique écrite. Les preuves et validations restent `needs-review`. |
| Parcours utilisateurs | [User flows](product/user-flows.md) | Parcours de référence; tirages préparables en interne seulement avant validation juridique écrite, boutique limitée aux récompenses garanties, gestion explicite des lots/contenus et support privé du gagnant; validations et preuves `needs-review`. |
| Readiness de conception | [Design readiness](design/design-readiness.md) | État courant du gate; `review` signifie que la conception n’est pas approuvée. |
| DASH-V3 et composition Viewer | [Design freeze](design/dashboard-v3-design-freeze.md) | Séquencement de conception; la proposition `/dashboard/tirages` du 2026-11-07 reste en revue; aucune approbation globale n’est impliquée. |
| Traçabilité ACT et actions ouvertes | [Registre de traçabilité](design/design-traceability-and-open-actions-2026-10-18.md) | Registre vivant lié aux preuves et limites; le [scan ACT-11 du 2026-11-18](quality/evidence/act11-marker-scan-2026-11-18/README.md) est le relevé courant, tandis que les scans précédents restent historiques. |
| Preuves QA par story | [Matrice P0](quality/p0-evidence-matrix.md) | Résultats datés, SHA observé et limites de portée; E2E US-007 auth-lifecycle 2/2 au worktree basé sur `fae60bd`, 12 migrations, avec scopes et limites consignés. |
| Décisions ACT-03/ACT-09 et baseline prudente US-009..011 | [Demande de readiness](delivery/readiness-decision-request.md) et [journal des décisions](delivery/decision-log.md) | Boutique de récompenses garanties; tirages/cartes à gratter désactivés publiquement jusqu’à validation juridique écrite; durées de conservation à définir par finalité. La baseline ne remplace ni l'avis juridique, ni les validations Data/Conformité, ni les preuves d’exécution ou l’approbation globale. |
| Médias et provenance | [Inventaire média](design/media-inventory.md) | Sources, usages et limites de preuve ACT-09. |
| Icônes PNG des dashboards | [Usage par route](design/dashboard-icon-usage.md) et [inventaire des assets](design/dashboard-v3-assets.md) | L’usage par route et les dimensions d’assets sont séparés; les mesures navigateur restent bornées aux parcours documentés. |
| Audit UX des dashboards | [Audit UX des dashboards utilisateur et administrateur](audits/90-audit-dashboards-ux.md) | Comparaison Admin/Viewer, corrections ciblées et preuves visuelles datées; les limites de QA restent explicites. |
| Tickets à gratter | [Maquettes des paliers](design/scratch-card-mockups/README.md) | Référence visuelle des paliers; les PNG actifs sont indiqués par chemin. |
| Diagrammes | [Index des diagrammes](diagrams/README.md) | Index des diagrammes sources et documents référents. |
| Référencement naturel | [SEO](seo.md) | Contrat SEO du frontend public, relire le code pour l’état courant. |
| Règlement de jeu | [Projet de règlement](12-reglement-jeu-projet.md) | Projet de texte et placeholders; distinct du registre de conformité. |
| Confidentialité | [Note d’intégration de la politique](15-politique-confidentialite.md) et le contenu servi par `frontend/src/components/legal/ConfidentialiteContent.tsx` | Le texte rendu par le composant est la source du contenu public courant; aucune validation juridique externe n’est acquise. |
| Conformité et readiness | [Registre de conformité](10-legal-compliance.md) | Risques et exigences; ne remplace ni le règlement ni la politique publique. |
| Style du code | [Audit de style](code-style-audit.md) | Audit daté du 9 septembre 2026; constat historique limité à son périmètre. |
| Internationalisation | [Internationalisation FR/EN](internationalisation.md) | Référence de langue; relire le code pour le comportement courant. |
| Suivi projet distant | [GitHub Project](project-management/github-project.md) | État de suivi, à relire à la source distante. |
| Journal qualité | [Quality journal](quality/quality-journal.md) | Événements et revues datés, dont le couplage Auth/Realtime ouvert sous QJ-004 et suivi par ADR-017. |

## Archives et preuves

Les fichiers sous [`archive/`](archive/) sont conservés pour leur provenance ou leur valeur historique. Ils ne remplacent pas automatiquement les références canoniques du tableau.

| Ancien emplacement ou famille | État courant |
| --- | --- |
| `00-overview.md` | Archivé dans [`archive/product/overview-2026-10-22.md`](archive/product/overview-2026-10-22.md); pitch, acteurs et hors-scope repris dans la vision produit. |
| Ancien guide de contribution | Retiré de la documentation produit; les consignes internes de développement restent hors de ce corpus. |
| `13-code-style-audit.md` | Renommé en [`code-style-audit.md`](code-style-audit.md); le constat reste daté. |
| `13-internationalisation.md` | Renommé en [`internationalisation.md`](internationalisation.md). |
| `13-politique-confidentialite.md` | Version de travail historique archivée sous [`archive/legal/`](archive/legal/); le contenu servi par le frontend est la référence publique actuelle. |
| Rapports UI-ICON `implementation`, `frontend-audit`, `docker-audit` | Versions remplacées ou partielles sous [`archive/design/`](archive/design/) et [`archive/reports/`](archive/reports/); les rapports actuels et preuves restent dans `design/`. |
| `admin-viewer-theme-*-report.md` | Rapports d’une même campagne archivés dans `archive/reports/`; leurs verdicts ne prouvent pas le rendu courant. |
| `design/data-model.md` | Version conceptuelle explicitement remplacée archivée sous `archive/design/`; utiliser `03-data-model.md`. |
| Concept statique Notifications | Prototype déplacé dans [`archive/prototypes/notifications-modal-concept/`](archive/prototypes/notifications-modal-concept/); l’ADR et le code produit ont leurs propres statuts. |
| Brief MVP original | Conservé localement, non versionné et exclu de cette PR; le texte original n’est pas réécrit. |
| Audits, captures et scans datés | Conservés sous `audits/`, `quality/evidence/` ou dans les archives; ils décrivent leur date, leur branche/SHA et leur méthode, pas l’état actuel. La [revue QA des critères du 2026-10-18](audits/qa-story-criteria-crosscheck-2026-10-18.md) est supersédée pour les critères courants US-003/004; ses preuves QA restent historiques. |
| `delivery/dash-v3-design-decision-request.md` | Note de décision du 2026-10-11 archivée dans [`archive/reports/dash-v3-design-decision-request-2026-10-11.md`](archive/reports/dash-v3-design-decision-request-2026-10-11.md); la décision est déjà consignée dans le registre canonique. |
| `delivery/dash-v3-audit-delivery-note.md` | Note d’audit et de livraison historique archivée dans [`archive/reports/dash-v3-audit-delivery-note-2026-10-11.md`](archive/reports/dash-v3-audit-delivery-note-2026-10-11.md); les références de branche/PR/CI ne décrivent pas l’état actuel. |
| `delivery/roadmap.md` | Roadmap historique déplacée vers [`archive/delivery/roadmap-2026-10-22.md`](archive/delivery/roadmap-2026-10-22.md); le [GitHub Project](project-management/github-project.md) reste le suivi canonique. |
| `design/ui-icon-style-independent-review.md` et `design/ui-icon-style-qa.md` | Rapports datés du 2026-10-25 archivés sous [`archive/reports/`](archive/reports/); le [`ui-icon-style-pack-audit-current.md`](design/ui-icon-style-pack-audit-current.md) reste la référence actuelle. |
| `design/dashboard-prototype-2.0.html` | Prototype/test historique conservé à son emplacement car un audit daté le référence; ce n’est pas une preuve du comportement produit. |
| Artefacts UX-003 (`ux-003-audit.md`, `ux-003-target-architecture.md`, `ux-003-prototype.html`) | Les trois éléments sont historiques/remplacés et archivés sous [`archive/design/`](archive/design/); ils ne définissent pas le travail courant. |

Les historiques complets de conversation, `.DS_Store` et rapports internes ignorés par Git ne sont pas des références publiques ou des preuves de livraison. Les rapports spécialisés ne deviennent pas une approbation générale; leur portée et leurs limites restent attachées à chaque rapport.

## Règle de lecture des preuves

Les snapshots et rapports historiques décrivent uniquement leur date, leur SHA
et leur périmètre. Ils ne modifient pas l’état courant et ne font pas passer une
story ou une gate à l’approbation sans nouvelle preuve datée et rattachée à un
SHA précis, puis sa relecture requise.

Les [audits transversaux](audits/76-audit-complet.md) et le
[pentest complet](audits/62-pentest-complet.md) restent consultables comme
rapports historiques; leur contenu ne remplace pas les sources canoniques ci-dessus.
