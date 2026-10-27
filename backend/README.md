<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

Les tests E2E démarrent l'application complète et nécessitent une base
PostgreSQL et Redis accessibles via `DATABASE_URL` et `REDIS_URL`. Le client
Prisma est régénéré avant les contrôles d'intégration lorsque le schéma évolue.
La configuration Jest E2E résout les imports TypeScript générés par Prisma et
fournit uniquement un secret JWT de test si aucun secret n'est défini.
La CI démarre PostgreSQL et Redis éphémères, prépare le schéma avec Prisma,
puis exécute cette suite sans utiliser les secrets de production.

Le test HTTP ciblé `test/me-dashboard-viewer.e2e-spec.ts` signe ses jetons
avec la valeur initiale de `JWT_SECRET`, déjà capturée lors de l'import de
`AuthModule` par `MeModule`. Il ne réassigne donc pas cette variable dans
`beforeAll`; ainsi, la clé du jeton et celle du garde restent identiques en
local et en CI.

Le scénario `test/announcements-lifecycle.e2e-spec.ts` démarre le module HTTP
des annonces avec le vrai `PrismaService` et le vrai `AnnouncementsService`.
Il vérifie la visibilité Viewer et les événements d'audit après les mutations
du cycle. Il refuse de s'exécuter sans
`ANNOUNCEMENT_E2E_ALLOW_DATABASE=1`, sur un hôte autre que localhost ou le
service Postgres CI, ou sur une base dont le nom ne contient pas `test` ou
`qa`. Appliquer les migrations sur une base jetable avant de le lancer :

```bash
DATABASE_URL=postgresql://qa:qa@127.0.0.1:5432/skkup_qa ANNOUNCEMENT_E2E_ALLOW_DATABASE=1 npm run test:e2e -- --runInBand test/announcements-lifecycle.e2e-spec.ts
```

La CI crée une base dédiée `skuup_test`, y applique les migrations puis définit
explicitement `ANNOUNCEMENT_E2E_ALLOW_DATABASE=1` pour la suite E2E. Ne jamais
activer ce drapeau pour une base de développement ou de production.

## Cycle des annonces

Les annonces suivent les états `DRAFT`, `PUBLISHED` et `ARCHIVED`. Les routes
de mutation restent protégées par `AdminGuard`:

- `POST /admin/announcements` crée toujours un brouillon masqué.
- `POST /admin/announcements/:id/publish` publie explicitement un brouillon.
- `DELETE /admin/announcements/:id` archive sans supprimer.
- `POST /admin/announcements/:id/restore/:eventId` restaure l'instantané d'un
  événement d'archive.

Les réponses d'administration exposent `status` et conservent `actif` comme
alias de compatibilité (`true` uniquement pour `PUBLISHED`). Le `PATCH` accepte
encore un ancien champ `actif` et le traduit en publication ou archivage; les
nouveaux clients doivent employer les actions explicites. Une édition archivée,
une publication d'un état autre que brouillon et une restauration d'un événement
qui n'est pas une archive renvoient `409`. Une publication ou un archivage
répétés sont idempotents sans événement d'audit supplémentaire. Les mutations
et leurs événements d'audit sont écrits dans une transaction.

La migration `20261023000000_announcement_lifecycle_and_kick` conserve toutes
les annonces: `actif=true` devient `PUBLISHED`, `actif=false` devient
`ARCHIVED`, sans republier les annonces masquées. Un trigger maintient l'alias
`actif` pour les anciennes instances et clients. Le rollback applicatif vers une
version qui ignore `status` continue de masquer les brouillons comme annonces
inactives; le retour complet à la distinction DRAFT/ARCHIVED requiert une
version qui lit `status`. La migration ne supprime ni données ni ancienne
colonne. L'énumération de plateforme ajoute aussi `KICK` sans modifier les
valeurs existantes.

## Annonces viewer

`GET /viewer/announcements` fournit aux comptes Viewer authentifiés les annonces
publiées (`status: PUBLISHED`), y compris celles dont la date de début est future
ou dont la date de fin est passée. Les brouillons et annonces archivées sont
exclus. La réponse est paginée par lots fixes de 50 éléments: `{ items,
nextCursor }`. Envoyer `nextCursor` dans le paramètre `cursor` pour lire la page
suivante; il vaut `null` à la dernière page. Le curseur opaque est stable sur
`createdAt` puis `id`; aucun total ni taille de page client n'est accepté. Chaque
élément expose le titre et le texte brut nécessaires au menu Notifications; aucun
suivi de lecture ni compteur n'est géré par cette route.
L'endpoint historique `GET /announcements/active` reste distinct et continue
de filtrer les annonces selon leur période courante.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Backend

## Modules administrateur

Les routes suivantes sont protégées par `AdminGuard` et la validation globale
des DTO :

- `GET/POST /admin/lots`, `GET/PATCH/DELETE /admin/lots/:id` : catalogue des
  lots, recherche, stock (`quantite`), fournisseur et sponsor. Les lots ne
  sont modifiables ou supprimables que tant que le tirage est ouvert et qu'ils
  n'ont pas de gagnant.
- `GET /admin/users?search=...`, `GET /admin/users/:id` : liste bornée et
  détail sans mot de passe ni secret.
- `PATCH /admin/users/:id/status` avec `{ "actif": boolean }` : activation
  ou désactivation. Une désactivation incrémente `sessionVersion` et invalide
  immédiatement les sessions existantes.

Les sessions web portées par cookie sont valables pour le jour de connexion
uniquement. Au changement de journée, l'ancien cookie est refusé et le
dashboard redirige vers `/connexion`; une nouvelle connexion est donc requise
avant l'enregistrement automatique de la visite quotidienne. Le jeton propre à
l'extension reste indépendant de cette règle.

- `GET /admin/users/:id/audit` : événements d'administration associés au
  compte.

Les changements de lots et de statut utilisateur sont enregistrés dans
`ContentAuditEvent`. Le champ `users.actif` est ajouté par la migration
`20261003000000_user_active_status`.

## Contrat cockpit admin V3

`GET /admin/dashboard/summary` est protégé par `AdminGuard`. Il fournit des
compteurs bornés pour les utilisateurs, tirages ouverts, contenus publiés,
annonces publiées, signalements ouverts et streams actifs, ainsi que les huit
dernières activités d'audit. Les agrégats sont exécutés en parallèle et les
sélections excluent les mots de passe, jetons et autres credentials.
Les lignes de tirages ouverts exposent aussi leur description contractuelle et
les annonces publiées leur texte, afin que le cockpit puisse conserver la
densité informative de la référence sans ajouter de contenu fictif.

## Contrat cockpit viewer V3

`GET /public/stats` retourne le nombre persistant d'utilisateurs inscrits.
La Gateway diffuse la même valeur via `users:count` sur la room publique
après chaque inscription et à la connexion d'un client. Le compteur ne
repose pas sur une fixture ou une valeur de démonstration.

`GET /me/dashboard/summary` est protégé par `JwtAuthGuard` et `ViewerGuard`;
les comptes qui n'ont pas le rôle `VIEWER` reçoivent 403. La route renvoie un
agrégat limité à l'utilisateur viewer authentifié : profil minimal, secondes de
visionnage validées, nombre de sessions, tickets de tirage, cartes à gratter
disponibles et cinq transactions récentes. Le temps de visionnage est
agrégé depuis `WatchSession` côté API et ne peut pas être fourni par le
navigateur.

### Cartes à gratter en deux phases

`POST /me/scratch-cards/:id/prepare` réserve de façon idempotente le résultat
aléatoire d'une carte sans créditer les points ni créer de ticket. Le résultat
est transmis uniquement à l'appel de préparation; les lectures ordinaires de
`GET /me/scratch-cards` masquent les champs réservés tant que la carte n'est
pas validée. Une nouvelle préparation retourne le même résultat et ne permet
pas de relancer le tirage.

`POST /me/scratch-cards/:id/scratch` valide atomiquement la carte préparée,
crédite le gain ou le ticket, puis marque la carte comme utilisée. Les clients
qui appellent directement l'ancienne route sans préparation gardent le même
comportement en une requête. Le seuil visuel de 90 % est appliqué par
l'interface; les gains et leur attribution restent calculés et validés par
l'API. Si le tirage réservé n'est plus ouvert au moment de la validation, la
carte est convertie en points selon son palier.

## Fixture locale de recette DASH-V3

La commande `npm run qa:seed-dashboard-v3` prépare un tirage, un lot, une annonce,
onze signalements distincts, deux chaînes, trois cartes à gratter et deux contenus
éditoriaux explicitement préfixés `qa_dashv3_` pour la comparaison navigateur des
fiches admin. Les signalements utilisent des identifiants, types et dates fixes :
la fixture est donc idempotente et rend la pagination de modération reproductible.
Elle est refusée par défaut, exige `DASHV3_QA_FIXTURE=1` et
`DASHV3_QA_ENVIRONMENT=qa|staging`, vérifie le compte admin QA
et refuse toujours `NODE_ENV=production`. Elle ne doit jamais être exécutée sur
une base de production et n'effectue aucune insertion SQL directe : elle passe
uniquement par Prisma. Pour `qa-dashv3-home`, elle réinitialise aussi
l'historique `ContentVersion` de la fixture et recrée la version 1 publiée,
afin que la restauration officielle par version reste testable après plusieurs
exécutions du seed.

### Données locales de densité

La commande `LOCAL_DEMO_DATA=1 NODE_ENV=development npm run build && LOCAL_DEMO_DATA=1 npm run local:seed-demo` ajoute 50 comptes de démonstration et un volume d'activités, de sessions, de cartes et de tickets destiné à tester les tableaux chargés dans Docker. Les comptes utilisent des adresses `@local.skkup.fr` et ne remplacent jamais les comptes existants. Le seed est idempotent, refusé en production et nécessite déjà un compte administrateur dans la base locale.
