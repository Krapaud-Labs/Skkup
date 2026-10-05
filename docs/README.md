# Dossier de conception du projet

L’audit transversal de la carte QA est consigné dans [docs/audits/76-audit-complet.md](audits/76-audit-complet.md). Le pentest technique P04 est consigné dans [docs/audits/62-pentest-complet.md](audits/62-pentest-complet.md). Les validations non exécutées y sont distinguées des contrôles réussis.

## Statut

Statut : updated, 2026-09-25, responsable : Mickael MUR avec assistance Codex.

## Rôle

Ce dossier est la source de vérité entre le besoin métier, la conception et le code. Il doit permettre à un développeur, un testeur, un auditeur ou un nouveau membre de comprendre le projet sans déduire des règles implicites.

## Règles de qualité

- Toute affirmation distingue fait vérifié, hypothèse, décision et élément à valider.
- Toute user story possède des critères testables et une priorité.
- Toute interface, donnée sensible, permission, dépendance externe et erreur significative est documentée.
- Chaque diagramme est en Mermaid ou possède une source éditable versionnée.
- Toute évolution modifie, dans le même work item, le code, les tests et les documents touchés.
- Un document non applicable indique `Non applicable` avec une justification contextualisée.

## Index et traçabilité

| Artefact | Finalité | Référence de code ou test | Dernière mise à jour |
| --- | --- | --- | --- |
| Vision et périmètre | besoin, acteurs, limites | complet | relecture métier à venir |
| User stories | comportements attendus | complet | tests à relier |
| Parcours | étapes et erreurs utilisateur | complet | validation UX à venir |
| Architecture | composants et flux | complet | audit technique à venir |
| Données | entités, règles, rétention | complet | validation confidentialité à venir |
| Contrats | API, événements, interfaces | complet | tests contractuels à venir |
| Spécification design admin DASH-V3 | structure, composants, permissions et états des routes admin | [dashboard-v3-admin-spec.md](design/dashboard-v3-admin-spec.md) | revue design fidelity à venir |
| Audit qualité design admin DASH-V3 | écarts visuels priorisés et preuves de contrôle du cockpit et des routes admin | [dashboard-v3-admin-design-quality-2026-10-04.md](audits/dashboard-v3-admin-design-quality-2026-10-04.md) | corrections et QA responsive à poursuivre |
| Spécification design viewer DASH-V3 | structure, composants, hiérarchie, états et assets des six routes viewer | [dashboard-v3-viewer-spec.md](design/dashboard-v3-viewer-spec.md) | revue design fidelity à venir |
| Baseline motion DASH-V3 | usage obligatoire de Framer Motion pour les transitions et feedbacks accessibles | [visual-direction.md](design/visual-direction.md) | appliquée, validation écran par écran à poursuivre |
| Sécurité | menaces et protections | complet | audit sécurité requis |
| Plan de validation externe P01 | V-01, V-06, V-09 et V-10 | préparé | preuves externes et humaines à fournir |
| Roadmap et décisions | plan et arbitrages | complet | calendrier à définir |
---
last_updated: 2026-09-25
---
