---
last_updated: 2026-10-20
---

# Dossier de conception du projet

L’audit transversal de la carte QA est consigné dans [docs/audits/76-audit-complet.md](audits/76-audit-complet.md). Le pentest technique P04 est consigné dans [docs/audits/62-pentest-complet.md](audits/62-pentest-complet.md). Les validations non exécutées y sont distinguées des contrôles réussis.

## Statut

Statut : documentation uniquement mise à jour le 2026-10-18; aucune porte de conception ou de readiness n'est approuvée.

## Rôle

Ce dossier est la source de vérité entre le besoin métier, la conception et le code. Il doit permettre à un développeur, un testeur, un auditeur ou un nouveau membre de comprendre le projet sans déduire des règles implicites.

## Règles de qualité

- Toute affirmation distingue fait vérifié, hypothèse, décision et élément à valider.
- Toute user story possède des critères testables et une priorité.
- Toute interface, donnée sensible, permission, dépendance externe et erreur significative est documentée.
- Chaque diagramme est en Mermaid ou possède une source éditable versionnée.
- Toute évolution modifie, dans le même dossier de travail, le code, les tests et les documents touchés.
- Un document non applicable indique `Non applicable` avec une justification contextualisée.

## Index et traçabilité

| Artefact | Finalité | Référence de code ou test | Dernière mise à jour |
| --- | --- | --- | --- |
| Vision et périmètre | besoin, acteurs, limites | complet | relecture métier à venir |
| Décision produit ACT-11 | report hors MVP des valeurs métier non arrêtées, selon la réponse explicite du responsable du projet du 2026-10-18 | [Décision ACT-11](product/act-11-values-decision.md) | les valeurs et le périmètre restent à décider par leurs owners; aucune règle chiffrée n'est acceptée |
| User stories | comportements attendus | US-004/US-005 et leurs valeurs chiffrées restent `needs-review` selon ACT-11 | relier des tests seulement après décision owner; les seuils historiques ne sont pas des critères MVP acceptés |
| Premier jet fonctionnel V1 historique | conserve le brouillon initial, sans fixer le périmètre MVP ni les valeurs métier actuelles | [Spécifications fonctionnelles historiques](01-features.md) | les décisions owners du 2026-10-18 prévalent; barèmes, récompenses, probabilités, prix et calendrier non décidés restent hors MVP |
| Parcours | étapes et erreurs utilisateur | complet | validation UX à venir |
| Architecture | composants et flux | complet | audit technique à venir |
| Audit d'exploitation ACT-02 | configuration Compose suivie, observations locales datées, état Dokploy non vérifié et décisions Ops ouvertes | [Audit ACT-02 du 2026-10-18](design/ops-audit-2026-10-18.md) et [observations locales datées](quality/ops-evidence-current.md) | `needs-review`; alerting, astreinte, sauvegarde/restauration et rollback à confirmer par Ops |
| Données | entités, règles, rétention | document présent; validation/readiness reste à faire | validation confidentialité à venir |
| Contrats | API, événements, interfaces | document présent; certaines routes Cartes à gratter/Boutique et fréquences de tirage sont des propositions historiques, périmètre à confirmer selon ACT-11 | tests contractuels et décisions owners à obtenir avant de traiter ces propositions comme le contrat MVP |
| Audit des contrats API | comparaison document/source pour API-001..004 et Notifications; résultat historique rapporté (5 suites/47 tests, sans journal Jest brut) distingué des tentatives ultérieures de préparation échouées | [Audit API du 2026-10-18](design/api-contract-audit-2026-10-18.md) | `needs-review`; contrats cibles confirmés mais implémentation, guards et preuves de test requises |
| Audit sécurité ACT-05 | sessions, révocation, CSRF, limites, secrets, audit applicatif et sauvegardes | [Relevé ACT-05 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-05---audit-backend-et-audit-indépendant-2026-10-18) | `needs-review`; preuves déployées et décisions de sécurité à produire |
| Audit QA ACT-06 | couverture QA des stories P0 US-001 à US-006, runs unitaires backend (44 suites/296 tests) et frontend (88 suites, 231/237 passés, 6 skipped), distincts des campagnes historiques | [Matrice P0](quality/p0-evidence-matrix.md), [relevé ACT-06](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18) et [rapports bruts et limites](quality/evidence/p0-backend-unit-2026-10-18/README.md) | `needs-review`; unités seulement, six scénarios Notifications skipped; pas de preuve HTTP/DB/Redis/BullMQ, E2E, rendu navigateur, auth production ou validation métier |
| Relecture des critères QA par story | présence des specs, exécutions fraîches rapportées, critères non assertés et addendum ACT-11 du 2026-10-20 | [Rapport de rapprochement QA](audits/qa-story-criteria-crosscheck-2026-10-18.md) | `needs-review`; relecture documentaire seulement; les valeurs chiffrées hors MVP ne sont plus des critères QA acceptés |
| Audit parcours ACT-07 | transitions admin, révocation, erreurs et reprise; US-007 réversible par réactivation admin du compte, avec statut `FraudFlag` distinct | [Relevé ACT-07 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-07---parcours-admin-révocation-erreurs-et-reprise-2026-10-18) | `needs-review`; décision consignée, preuves intégrées de désactivation/réactivation, permissions et audit à produire |
| Audit visuel ACT-08 | rendu Notifications, accessibilité et limites du prototype | [Relevé ACT-08 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-08---audit-visuel-et-accessibilité-2026-10-18) et [revue navigateur du 2026-10-20](quality/evidence/notifications-browser-review-2026-10-20.md) | `needs-review`; snapshot `skkup-signup` reclassé comme antérieur; observation plus récente partielle; écarts de focus/backdrop et preuves restantes |
| Revue statique du prototype Notifications | audit du prototype documentaire seulement; aucun navigateur, serveur, API ou rendu du produit | [Rapport de revue statique du prototype du 2026-10-18](audits/frontend-static-notifications-prototype-2026-10-18.md) | `needs-review`; aucune validation du frontend produit ou du rendu navigateur |
| Audit médias ACT-09 | traçabilité des assets locaux, images de lots et miniatures distantes | [Relevé ACT-09 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-09---audit-médias-backenddata-et-indépendant-2026-10-18) | `needs-review`; inventaire fichier/ressource et preuves spécifiques à compléter |
| Revue indépendante de traçabilité ACT-12 | vérification documentaire limitée et rapprochement US → ACT → preuves → état | [Rapport ACT-12 du 2026-10-18](audits/act-12-independent-traceability-review-2026-10-18.md) et [table de correspondance dans le registre](design/design-traceability-and-open-actions-2026-10-18.md#rapprochement-us--act--preuves--état-actuel) | `needs-review`; verdict limité, critères de traçabilité restants à démontrer |
| Spécification design admin DASH-V3 | structure, composants, permissions et états des routes admin | [dashboard-v3-admin-spec.md](design/dashboard-v3-admin-spec.md) | revue design fidelity à venir |
| Audit qualité design admin DASH-V3 | écarts visuels priorisés et preuves de contrôle du cockpit et des routes admin | [dashboard-v3-admin-design-quality-2026-10-04.md](audits/dashboard-v3-admin-design-quality-2026-10-04.md) | corrections et QA responsive à poursuivre |
| Spécification design viewer DASH-V3 | structure, composants, hiérarchie, états et assets des six routes viewer | [dashboard-v3-viewer-spec.md](design/dashboard-v3-viewer-spec.md) | revue design fidelity à venir |
| Baseline motion DASH-V3 | usage obligatoire de Framer Motion pour les transitions et feedbacks accessibles | [visual-direction.md](design/visual-direction.md) | appliquée, validation écran par écran à poursuivre |
| Pairing production extension DASH-V3 | preuve du pairing et de la révocation avec le paquet Chrome Web Store publié | [extension-webstore-production-pairing-2026-10-11.md](qa/extension-webstore-production-pairing-2026-10-11.md) | expiration et reconnexion publiées à vérifier; suivi [ACT-06/US-003](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18) et [ACT-07](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-07---parcours-admin-révocation-erreurs-et-reprise-2026-10-18) |
| Traçabilité de conception et actions ouvertes | relier les stories aux parcours, composants, données, interfaces et preuves; décisions owner du 2026-10-18, demande UX d'inscription et relevés ACT-10, ACT-11 et ACT-12 | [design-traceability-and-open-actions-2026-10-18.md](design/design-traceability-and-open-actions-2026-10-18.md) | les avis indépendants ACT-11 sur le sous-lot documentaire sont acceptés, voir [suivi #297](https://github.com/Krapaud-Labs/Skkup/issues/297#issuecomment-6286841556); ACT-01 à ACT-13 restent `needs-review`, sans approbation globale |
| Matrice des exigences et preuves MVP-001 | complément transversal ACT-01 à ACT-13 relié aux sections, stories et preuves existantes; observation Chrome/Docker locale du 2026-10-20 et limites d'identité de build consignées | [Matrice exigences et preuves](design/mvp001-requirements-evidence-matrix.md) | `needs-review`; complète la matrice P0 sans la remplacer; ACT-04/08 distinguent les constats antérieurs et l'observation courante; aucune approbation ni livraison revendiquée |
| Revue navigateur Notifications | synthèse vérifiée des rapports frontend, QA et auditeur et de l'observation locale du 2026-10-20 | [Revue navigateur Notifications](quality/evidence/notifications-browser-review-2026-10-20.md) | trois verdicts spécialisés `rework`; limites de preuve et écarts à ADR-011 consignés; aucune approbation globale |
| Notifications viewer et annonces | contrat cible owner confirmé pour consulter les annonces publiées dans Notifications et ouvrir le détail en modal | [ADR-011](design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md) | cible confirmée mais non implémentée; guard, tests et readiness restent à prouver |
| Prototype statique Notifications viewer | maquette statique du menu Notifications et du modal d'annonce | [README du prototype](design/evidence/notifications-modal-concept/README.md) | maquette statique uniquement; pas de rendu navigateur, aucune implémentation |
| Suivi du projet | état et décisions de suivi | [Document dédié au suivi du projet](project-management/github-project.md) et [PR #419, source de vérité vivante](https://github.com/Krapaud-Labs/Skkup/pull/419) | #297 ouverte, deux critères décochés; snapshots head/CI datés, dernier relevé 6/6 au SHA `9964fa7`; readiness `review`; aucun gate global fermé |
| Sécurité | menaces et protections | document présent; validation/readiness reste à faire | audit sécurité requis |
| Plan de validation externe P01 | V-01, V-06, V-09 et V-10 | préparé | preuves externes et humaines à fournir |
| Roadmap et décisions | plan et arbitrages | document présent, calendrier à définir/review owner produit | décision de calendrier et relecture par le owner produit à fournir |
