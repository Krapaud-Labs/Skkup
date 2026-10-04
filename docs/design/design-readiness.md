# Design readiness

Status: draft

## Plan de reprise issu de l'audit indépendant

Le dossier reste en `draft` tant que les corrections ci-dessous ne sont pas traitées et relues. Cette liste ne vaut pas approbation.

1. Réconcilier le périmètre MVP/Post-MVP entre vision, roadmap et readiness.
2. Compléter architecture, déploiement, observabilité, erreurs, disponibilité et dépendances externes.
3. Compléter le modèle de données avec attributs, intégrité, rétention, export, suppression et rollback.
4. Aligner les contrats API sur les endpoints implémentés et leurs erreurs, permissions, limites et tests.
5. Compléter les preuves de sécurité concernant secrets, sessions, limites, audit admin, sauvegardes et préproduction.
6. Relier les stories P0 à des tests ou preuves précis.
7. Décrire les parcours admin, révocation, erreurs de plateforme, plafond et reprise.
8. Compléter la direction visuelle, les états UI, le clavier, les contrastes et `prefers-reduced-motion`.
9. Compléter la provenance, licence et preuve d'usage de chaque média.
10. Tracer les décisions ouvertes et leurs responsables.
11. Résoudre ou formaliser les mentions restantes « à vérifier », « à planifier » et « à définir ».
12. Ajouter la traçabilité vision → stories → parcours → architecture → API/données → preuves.
13. Faire relire les corrections par un auditeur distinct.
14. Passer à `Status: review` uniquement après ces corrections, jamais directement à `approved`.

La conception DASH-V3 est cadrée dans [dashboard-redesign-2.0.md](dashboard-redesign-2.0.md). Les références structurelles sont dans [dashboard-wireframes-2.0.md](dashboard-wireframes-2.0.md) et le séquencement frontend est décrit dans le plan de migration de ce document. Ces éléments ne valent pas encore validation visuelle indépendante.

## Validation

- [ ] Cahier des charges accepté et périmètre MVP/Post-MVP arrêté
- [ ] Vision, stories et parcours cohérents
- [ ] Architecture, données, contrats et sécurité relus
- [ ] Direction visuelle et médias définis si applicable
- [ ] Diagrammes, roadmap et décisions à jour
- [ ] Audit de conception effectué
- [ ] Aucun marqueur de complétion non traité : contrôle à refaire après l'audit de conception complet

## Preuves et approbation

- Relecture indépendante : effectuée le 2026-10-03; décision `rework`
- Écarts confirmés : disponibilité et exploitation, données et rollback, rapprochement API/code, preuves de sécurité, preuves P0, parcours admin, médias, traçabilité et marqueurs d'incertitude.
- Auditeur : relecteur indépendant distinct du concepteur; nouvelle relecture requise après corrections
- Date : 2026-10-03
- Décision : Non approuvé. Les corrections du plan et une nouvelle relecture indépendante restent requises.
