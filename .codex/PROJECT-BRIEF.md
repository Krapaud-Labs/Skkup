# Cahier des charges projet

## Statut

accepted

Source de cadrage : `docs/00-overview.md`, `docs/01-features.md`,
`docs/02-architecture.md`, `docs/04-api-contract.md`, `docs/05-security.md`,
`docs/08-docker-infra.md` et `docs/10-legal-compliance.md`.

## Vision et problème à résoudre

Skkup récompense le visionnage actif de streams libres sur Twitch, YouTube ou
Facebook Live. L'utilisateur gagne des points via la visite quotidienne et
l'extension navigateur, puis convertit ces points en tickets de tirages au
sort proposant des lots réels. L'extension mesure le visionnage ; aucun lecteur
embarqué ni flux partenaire n'est requis pour la V1.

## Utilisateurs concernés

- Visiteur public : consulte la vitrine, les tirages et les informations légales.
- Utilisateur : crée un compte natif, installe et apparie l'extension, cumule des
  points, consulte ses tickets et ses tirages.
- Administrateur : gère les lots, tirages, annonces, signaux de fraude et
  paramètres métier selon ses permissions.

## Objectifs mesurables

- Permettre l'inscription, la connexion et la déconnexion par formulaire natif.
- Créditer les points de visite et de visionnage via des sessions vérifiables.
- Convertir les points en tickets avec des tirages déterministes et audités.
- Exposer un tableau de bord utilisateur et un espace d'administration protégés.
- Publier une extension Manifest V3 compatible Chrome en V1.0.

## Fonctionnalités attendues

Authentification email/mot de passe, dashboard persistant, extension appariée,
visionnage libre, suivi anti-fraude, points, tickets, tirages, lots, annonces,
notifications temps réel et interface publique responsive.

## Hors périmètre

Cash-out en argent réel, offres partenaires, programme d'affiliation streamer,
lecteurs embarqués, overlay Twitch et publication Firefox ou Opera en V1.0.

## Contraintes

TypeScript avec Next.js côté frontend, NestJS côté backend, PostgreSQL et
Prisma pour les données, Redis et BullMQ pour les traitements asynchrones,
Socket.io pour le temps réel, Docker Compose avec Traefik sur VPS Dokploy et
GitHub Actions pour la CI. Les données sensibles restent hors du dépôt. Les
contrôles sécurité, la conformité jeu-concours et le GitFlow sont obligatoires.

## Critères de réussite

Les commandes de lint, typecheck, tests et build des trois sous-projets passent,
la CI est verte, les routes publiques, utilisateur et administrateur sont
protégées selon leur rôle, l'extension crédite une session valide sans double
crédit, et la documentation reste alignée avec le code.

## Informations manquantes ou décisions attendues

Les montants, dates et modalités juridiques définitives des tirages restent à
valider par le responsable légal du projet. Les secrets de production et les
accès externes restent fournis uniquement au moment du déploiement.
