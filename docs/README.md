---
last_updated: 2026-10-18
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
| User stories | comportements attendus | complet | tests à relier |
| Parcours | étapes et erreurs utilisateur | complet | validation UX à venir |
| Architecture | composants et flux | complet | audit technique à venir |
| Audit d'exploitation ACT-02 | configuration Compose suivie, contrôles locaux datés, état Dokploy non vérifié et décisions Ops ouvertes | [Audit d'exploitation du 2026-10-18](design/ops-audit-2026-10-18.md) | `needs-review`; alerting, astreinte, sauvegarde/restauration et rollback à confirmer par Ops |
| Données | entités, règles, rétention | document présent; validation/readiness reste à faire | validation confidentialité à venir |
| Contrats | API, événements, interfaces | document présent; validation/readiness reste à faire | tests contractuels à venir |
| Audit des contrats API | comparaison document/source détaillée pour API-001..004 et Notifications, avec preuves contrôleur/DTO/tests et classifications | [Audit API du 2026-10-18](design/api-contract-audit-2026-10-18.md) | `needs-review`; `/viewer/announcements` reste une proposition ADR, décisions humaines et preuves de test requises |
| Audit sécurité ACT-05 | sessions, révocation, CSRF, limites, secrets, audit applicatif et sauvegardes | [Relevé ACT-05 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-05---audit-backend-et-audit-indépendant-2026-10-18) | `needs-review`; preuves déployées et décisions de sécurité à produire |
| Audit QA ACT-06 | couverture QA des stories P0 US-001 à US-006 et limites des campagnes historiques | [Relevé ACT-06 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18) | `needs-review`; résultats non entièrement réconciliés |
| Audit parcours ACT-07 | transitions admin, révocation, erreurs et reprise | [Relevé ACT-07 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-07---parcours-admin-révocation-erreurs-et-reprise-2026-10-18) | `needs-review`; décisions humaines et preuves intégrées non réconciliées |
| Audit visuel ACT-08 | rendu Notifications, accessibilité et limites du prototype | [Relevé ACT-08 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-08---audit-visuel-et-accessibilité-2026-10-18) | `needs-review`; rechecks ciblés terminés, preuves navigateur et rendu produit à produire |
| Audit médias ACT-09 | traçabilité des assets locaux, images de lots et miniatures distantes | [Relevé ACT-09 du 2026-10-18](design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-09---audit-médias-backenddata-et-indépendant-2026-10-18) | `needs-review`; inventaire fichier/ressource et preuves spécifiques à compléter |
| Spécification design admin DASH-V3 | structure, composants, permissions et états des routes admin | [dashboard-v3-admin-spec.md](design/dashboard-v3-admin-spec.md) | revue design fidelity à venir |
| Audit qualité design admin DASH-V3 | écarts visuels priorisés et preuves de contrôle du cockpit et des routes admin | [dashboard-v3-admin-design-quality-2026-10-04.md](audits/dashboard-v3-admin-design-quality-2026-10-04.md) | corrections et QA responsive à poursuivre |
| Spécification design viewer DASH-V3 | structure, composants, hiérarchie, états et assets des six routes viewer | [dashboard-v3-viewer-spec.md](design/dashboard-v3-viewer-spec.md) | revue design fidelity à venir |
| Baseline motion DASH-V3 | usage obligatoire de Framer Motion pour les transitions et feedbacks accessibles | [visual-direction.md](design/visual-direction.md) | appliquée, validation écran par écran à poursuivre |
| Pairing production extension DASH-V3 | preuve du pairing et de la révocation avec le paquet Chrome Web Store publié | [extension-webstore-production-pairing-2026-10-11.md](qa/extension-webstore-production-pairing-2026-10-11.md) | expiration et reconnexion publiées à vérifier |
| Traçabilité de conception et actions ouvertes | relier les stories aux parcours, composants, données, interfaces et preuves; relevés ACT-10, ACT-11 et ACT-12 datés du 2026-10-18 | [design-traceability-and-open-actions-2026-10-18.md](design/design-traceability-and-open-actions-2026-10-18.md) | ACT-01 à ACT-13 et relevés ACT-10/ACT-11/ACT-12 restent `needs-review` |
| Notifications viewer et annonces | proposition réversible pour consulter les annonces publiées dans Notifications et ouvrir le détail en modal | [ADR-011](design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md) | proposition en revue, aucune implémentation |
| Prototype statique Notifications viewer | maquette statique du menu Notifications et du modal d'annonce | [README du prototype](design/evidence/notifications-modal-concept/README.md) | maquette statique uniquement; pas de rendu navigateur, aucune implémentation |
| Suivi du projet | état et décisions de suivi | [Document dédié au suivi du projet](project-management/github-project.md) | issue #297 ouverte; validations design et livraison encore en attente |
| Sécurité | menaces et protections | document présent; validation/readiness reste à faire | audit sécurité requis |
| Plan de validation externe P01 | V-01, V-06, V-09 et V-10 | préparé | preuves externes et humaines à fournir |
| Roadmap et décisions | plan et arbitrages | document présent, calendrier à définir/review owner produit | décision de calendrier et relecture par le owner produit à fournir |
