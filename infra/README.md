# Infra

Ce dossier accueille les fichiers d'infrastructure complémentaires qui ne
vivent pas à la racine. La topologie Docker opérationnelle est actuellement
définie par :

- `docker-compose.yml` pour les services communs ;
- `docker-compose.override.yml` pour le développement local ;
- `docker-compose.prod.yml` pour Traefik, TLS et le routage de production ;
- `docker-compose.dokploy.yml` pour un VPS piloté par Dokploy, sans second
  reverse proxy ;
- `frontend/Dockerfile`, `backend/Dockerfile` et
  `backend/Dockerfile.worker` pour les images applicatives.

Voir `.codex/PROJECT-CONTEXT.md` pour le détail de la topologie et des variables
d'environnement.
