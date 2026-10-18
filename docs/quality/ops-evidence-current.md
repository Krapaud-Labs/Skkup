---
last_updated: 2026-10-18
---

# Preuves d'exploitation locales datées et état distant

Date : 2026-10-07

Portée : ce document conserve des observations locales historiques du 7 et du
8 octobre 2026. Il n'est pas une attestation de l'état courant de Dokploy ou de
la production. Le Compose Dokploy suivi contrôle l'API par `GET /`; l'endpoint
`GET /health` renvoie un état `ok` simple et ne vérifie pas les dépendances.
Le détail des configurations, des observations et des preuves manquantes est
dans [`../design/ops-audit-2026-10-18.md`](../design/ops-audit-2026-10-18.md).

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
- La documentation historique décrit une procédure de rollback Dokploy par
  sélection d'un commit précédent. Cette procédure n'est pas une preuve de
  capacité disponible; l'observation UI staging du 2026-10-11 n'a pas trouvé de
  sélecteur de commit ou bouton rollback (voir le rapport daté lié ci-dessus).

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

Ces résultats datés valident la syntaxe de configuration Compose et les
observations de la stack locale au moment des contrôles; ils ne valident pas
l'état actuel de Dokploy ou de la production.
Pour DASH-V3, le propriétaire produit accepte explicitement le risque de
livrer sans sauvegarde Dokploy configurée et reporte la mise en place d'une
destination, du rollback et de la restauration distante à un chantier Ops
dédié. Aucun secret ni fournisseur fictif n'est ajouté. Cette exception ne
vaut que pour cette carte et ne remplace pas une future readiness complète.
Cette acceptation de risque est conservée comme décision historique DASH-V3;
elle ne vaut pas approbation de readiness générale ou actuelle. Les logs de
maintenance présents dans le code ne prouvent pas qu'une alerte opérateur a été
configurée ou reçue. L'exercice de rollback et de restauration distante reste
à confirmer par l'opérateur sur un environnement autorisé.
