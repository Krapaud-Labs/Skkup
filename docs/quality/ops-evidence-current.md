# Preuves d'exploitation courantes

Date : 2026-10-07

## Contrôles exécutés

- `docker compose -f docker-compose.dokploy.yml config --quiet` : réussi.
- `docker compose -f docker-compose.yml config --quiet` : réussi.
- Les fichiers Compose contiennent des healthchecks pour les services
  persistants; `migrate` est contrôlé par son code de sortie et les services
  applicatifs attendent sa réussite.
- La documentation décrit la sauvegarde/restauration locale et le rollback
  Dokploy par sélection d'un commit précédent.

## Limites prouvées

- Aucun canal d'alerte opérateur réel n'est connecté ou observé dans cet
  environnement local.
- Aucun rollback applicatif sur une préproduction accessible n'a été exécuté
  dans cette session.
- La restauration PostgreSQL locale est une preuve de procédure, pas une
  preuve de disponibilité préproduction ni de reprise complète du service.

## Décision de readiness

Ces résultats valident la configuration Compose et la documentation locale,
mais ne ferment pas la preuve d'exploitation exigée par `design-gate` et
`audit-gate`. Une preuve préproduction datée avec alerte, rollback et
restauration reste requise.
