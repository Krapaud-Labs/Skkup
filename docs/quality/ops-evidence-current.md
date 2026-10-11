# Preuves d'exploitation courantes

Date : 2026-10-07

## Contrôles exécutés

Recontrôle du 2026-10-08 sur le Docker local :

- `docker compose -f docker-compose.yml config --quiet` : réussi.
- `docker compose -f docker-compose.dokploy.yml config --quiet` : réussi.
- Services `backend`, `frontend`, `postgres`, `proxy`, `redis` et `worker` :
  `healthy`.
- `docker exec skkup-backend-1 npx prisma migrate status` : **Database schema
  is up to date**, 6 migrations détectées, aucune migration en attente.

- `docker compose -f docker-compose.dokploy.yml config --quiet` : réussi.
- `docker compose -f docker-compose.yml config --quiet` : réussi.
- Le 2026-10-08, après démarrage local de Docker Desktop, `docker compose -f
  docker-compose.yml up -d` a démarré les services sans erreur bloquante.
  Postgres, Redis, backend et frontend sont `healthy`; le proxy Traefik est
  également `healthy`.
- Le conteneur de migration s'est terminé avec succès et ses logs indiquent
  `No pending migrations to apply`. Les logs backend indiquent le démarrage
  Nest réussi et les routes attendues sont enregistrées.
- Le 2026-10-07, le client Docker `29.8.2` était installé mais le daemon
  n'était pas accessible : le contexte `desktop-linux` refusait le socket
  utilisateur et le contexte `default` ne trouvait pas `/var/run/docker.sock`.
  Les deux commandes `config --quiet` restent néanmoins reproductibles.
- Les fichiers Compose contiennent des healthchecks pour les services
  persistants; `migrate` est contrôlé par son code de sortie et les services
  applicatifs attendent sa réussite.
- La documentation décrit la sauvegarde/restauration locale et le rollback
  Dokploy par sélection d'un commit précédent.

## Limites prouvées

- Aucun endpoint, identifiant de service ou fichier de configuration de
  préproduction n'est présent dans le périmètre versionné inspecté. La seule
  cible distante documentée est le service Dokploy de production; aucune
  exécution préproduction ne peut donc être prouvée depuis ce dépôt seul.
- Aucun canal d'alerte opérateur réel n'est connecté ou observé dans cet
  environnement local.
- Aucun rollback applicatif sur une préproduction accessible n'a été exécuté
  dans cette session.
- La restauration PostgreSQL locale est une preuve de procédure, pas une
  preuve de disponibilité préproduction ni de reprise complète du service.

## Décision de readiness

Ces résultats valident la configuration Compose et la documentation locale.
Pour DASH-V3, le propriétaire produit accepte explicitement le risque de
livrer sans sauvegarde Dokploy configurée et reporte la mise en place d'une
destination, du rollback et de la restauration distante à un work item Ops
dédié. Aucun secret ni fournisseur fictif n'est ajouté. Cette exception ne
vaut que pour cette carte et ne remplace pas une future readiness complète.
