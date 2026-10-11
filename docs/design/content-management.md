# Gestion de contenu administrateur

## Socle P12

Le module de contenu gère les ressources `LANDING`, `LEGAL`, `ANNOUNCEMENT`, `FAQ` et `MEDIA`, séparées par langue `fr` ou `en`. Chaque ressource possède un brouillon, une version entière, un contenu JSON validé par l’API et un historique de versions. Le contenu libre n’est jamais traduit automatiquement.

Les écritures sont réservées à `ADMIN`. La publication, la dépublication et la restauration créent un événement d’audit sans secret ni contenu sensible. Une ressource publique n’est renvoyée que si son statut est `PUBLISHED` et que la langue demandée existe.

## Contrat

- `GET /admin/content` liste les contenus avec filtres `type` et `locale`.
- `POST /admin/content` crée un brouillon.
- `PATCH /admin/content/:id` crée une nouvelle version de brouillon.
- `POST /admin/content/:id/publish` publie atomiquement la version courante.
- `POST /admin/content/:id/unpublish` retire la publication.
- `GET /admin/content/:id/versions` liste les versions.
- `POST /admin/content/:id/restore/:versionId` restaure les données dans une nouvelle version de brouillon.
- `GET /admin/content/audit` expose les événements aux administrateurs. Les paramètres optionnels `action`, `entityType` et `actorId` permettent de filtrer le journal côté serveur. La réponse conserve l’identifiant de l’acteur pour assurer la traçabilité sans exposer de secret.
- `GET /content/:type/:slug?locale=fr` expose uniquement le contenu publié.

La migration Prisma est versionnée. Les médias sont représentés par le type `MEDIA` et doivent référencer des URL HTTPS contrôlées ; un stockage de fichier et une bibliothèque graphique complète restent à brancher sur ce contrat avant une mise en production éditoriale.
