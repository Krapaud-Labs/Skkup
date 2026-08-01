# Infra

Ce dossier contiendra les fichiers d'infrastructure complémentaires (variantes
de `docker-compose`, scripts de déploiement) au fur et à mesure de
l'implémentation. Voir `docs/08-docker-infra.md` pour le détail de la
topologie prévue.

Les répertoires `frontend/` et `backend/` référencés dans
`docker-compose.yml` seront créés lors de l'initialisation des projets
Next.js et NestJS, une fois la documentation validée. Chacun contiendra son
propre `Dockerfile` (build multi-étapes).
