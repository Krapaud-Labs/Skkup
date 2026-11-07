---
last_updated: 2026-11-07
---

# Diagrammes

Conserver ici les sources Mermaid ou éditables. Chaque diagramme est référencé depuis un document de conception, possède un objectif, une date, un propriétaire et une légende. Ne jamais déposer seulement une image sans source modifiable.

| Fichier | Type | Objectif | Document référent | Statut |
| --- | --- | --- | --- | --- |
| architecture.md | contexte | flux frontend, extension, API et données | docs/design/architecture.md | intégré |
| user-flow.md | flowchart | inscription et crédit de points | docs/product/user-flows.md | intégré |
| `../product/user-flows.md#flow-002` | flowchart Mermaid | tirage manuel auditable | docs/product/user-flows.md | règles documentées; preuves de tirage et publication `needs-review` |
| `../product/user-flows.md#flow-003` | flowchart Mermaid | cycle DRAFT/PUBLISHED/ARCHIVED des annonces | docs/product/user-flows.md | règles owner documentées; preuve d'implémentation/livraison `needs-review` |
| `../product/user-flows.md#flow-007` | flowchart Mermaid | visite publique, vitrine, FAQ et informations légales | docs/product/user-flows.md | critères documentés; preuve de navigation complète à produire |
| `../product/user-flows.md#flow-008` | flowchart Mermaid | examen d'un signal de fraude et règle confirmée de réactivation | docs/product/user-flows.md | transitions et preuves intégrées `needs-review` |
| data-model.md | ER | relations métier principales | ../03-data-model.md | intégré |

L'inventaire complet des parcours est dans [user-flows.md](../product/user-flows.md).
Seuls les parcours dotés d'un diagramme Mermaid sont indexés comme diagrammes.
FLOW-004..006 restent sans étapes détaillées tant que les décisions produit
référencées ne sont pas prises; leur représentation graphique est `needs-review`.
