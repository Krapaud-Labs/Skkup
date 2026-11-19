---
last_updated: 2026-11-19
status: proposed; targeted independent review PASS; global design gate pending; implementation not authorized by this record
owner_approval: pending
---

# ADR-017 : Frontière entre Auth et Realtime

## Portée

Cette proposition décrit une première tranche structurelle pour retirer le
cycle d'import entre les modules NestJS `AuthModule` et `RealtimeModule`, sans
modifier les comportements du produit. Elle ne modifie ni le statut global de
`docs/design/design-readiness.md`, ni les contrats HTTP, le schéma Prisma, les
règles de session ou les choix métier. La readiness globale reste `review`.

## Constat vérifié dans le code

- `backend/src/auth/auth.module.ts` importe `RealtimeModule` avec
  `forwardRef(() => RealtimeModule)`. `AuthService` injecte
  `RealtimeService` et, après la création du compte, attend
  `notifierNombreUtilisateurs()` avant de générer la session.
- `backend/src/realtime/realtime.module.ts` importe de son côté
  `AuthModule` avec `forwardRef(() => AuthModule)`.
- `backend/src/realtime/realtime.gateway.ts` injecte `JwtService` et
  `SessionRevocationService`. Le premier vient de `JwtModule.register(...)`
  déclaré dans `AuthModule`, avec `JWT_SECRET` et `expiresIn: '24h'`. Le second
  est actuellement déclaré dans Auth et consommé également par
  `AuthService` et `AdminUsersService`.
- `SessionRevocationService` maintient un ensemble d'auditeurs en mémoire.
  `AuthService` l'appelle après la transaction de changement de mot de passe
  et après la révocation d'une session. `RealtimeGateway` s'y abonne pour
  déconnecter les sockets concernées.
- `backend/src/app.module.ts` importe les deux modules. `RealtimeModule` est
  marqué `@Global()`, mais cette propriété ne retire pas son besoin explicite
  de `JwtService` et de `SessionRevocationService`.

En conséquence, déplacer seulement `SessionRevocationService` ne supprime pas
le cycle : `RealtimeModule` dépend encore de `AuthModule` pour `JwtService`.
Le cycle ne disparaît que si la dépendance Realtime vers le large `AuthModule`
est remplacée par une dépendance vers un module étroit exportant ces deux
fournisseurs.

## Options examinées

| Option | Résultat | Coût et risque |
| --- | --- | --- |
| 1. Garder les deux `forwardRef` | Aucun changement immédiat. | Conserve le cycle et le couplage entre les modules complets. Pas de tranche de refactor. |
| 2. Déplacer uniquement `SessionRevocationService` dans un module partagé | Le gateway trouve le service sans importer Auth, mais il lui faut toujours le `JwtService` configuré par Auth. Le cycle persiste tant que `RealtimeModule` importe `AuthModule`. | Refactor incomplet; ne pas retenir seul. |
| 3. Créer un module runtime Auth étroit exportant `JwtModule` configuré et `SessionRevocationService` | Auth et Realtime dépendent de ce module; Auth conserve son accès à `RealtimeService`; Realtime ne dépend plus de `AuthModule`. Le graphe module devient acyclique. | Quelques imports et exports à déplacer. Préserve une seule configuration JWT et une seule instance du service de révocation. Option recommandée pour la relecture. |
| 4. Ré-enregistrer séparément `JwtModule` dans Realtime | Permet aussi de retirer l'import de `AuthModule`, si le service de révocation est rendu indépendant. | Duplique `JWT_SECRET`, durée et autres options. Risque de dérive entre JWT émis et JWT vérifié. Rejetée. |

## Proposition pour relecture

Créer `backend/src/auth/auth-runtime.module.ts`, sans contrôleur, contenant
l'enregistrement actuel de `JwtModule` et l'unique provider
`SessionRevocationService`, et exportant ces deux capacités. La classe reste
dans `backend/src/auth/session-revocation.service.ts`; seul son module
propriétaire change. `AuthModule` importe ce module, conserve le contrôleur,
`AuthService`, `JwtStrategy`, `PassportModule` et `OptionalJwtAuthGuard`, puis
ré-exporte le module runtime pour préserver les consommateurs existants
d'`AuthModule`. `RealtimeModule` importe directement le module runtime et
retire son import de `AuthModule`. `AuthModule` peut alors importer directement
`RealtimeModule`, sans `forwardRef`, puisque le lien inverse aura disparu.

Le service n'est pas redéfini dans deux modules : le gateway,
l'authentification et l'administration doivent partager la même instance
fournie par le module runtime.

## Invariants à préserver

1. Le secret reste lu depuis `process.env.JWT_SECRET`; la durée de signature
   reste `24h`; aucune option de signature ou de vérification ne change.
2. Le cookie, les routes, DTO, codes HTTP, stratégie Passport, autorisations
   et durée des sessions restent inchangés.
3. Après l'écriture durable de l'inscription, la notification publique du
   nombre de comptes reste attendue avant le retour de la session.
4. La transaction de changement de mot de passe reste inchangée et la
   révocation globale continue d'être relayée après son succès. La déconnexion
   ne révoque que le `sessionId` courant et garde le comportement actuel.
5. Les auditeurs sont appelés de façon synchrone, dans l'ordre et avec les
   paramètres actuels; les sockets correspondantes sont révoquées comme
   aujourd'hui.
6. La frontière des transactions Prisma, le worker, les événements Socket.io,
   leurs noms, rooms et payloads ne changent pas.
7. Le graphe d'imports des modules Auth/Realtime est acyclique et il n'existe
   qu'un seul provider `SessionRevocationService` dans l'application.

## Portée minimale d'implémentation

- Ajouter `backend/src/auth/auth-runtime.module.ts`.
- Déplacer la déclaration du provider et la configuration JWT sans modifier
  les options; garder la classe à son chemin TypeScript actuel.
- Adapter `backend/src/auth/auth.module.ts` et
  `backend/src/realtime/realtime.module.ts` pour importer/ré-exporter le module
  runtime et supprimer les deux `forwardRef`.
- Garder inchangés `AuthService`, `RealtimeGateway`, `AdminUsersService`, leurs
  imports TypeScript et les consommateurs existants d'`AuthModule`.
- Ne toucher à aucun autre domaine, endpoint, DTO, table, migration, logique
  métier, client frontend ou extension.

## Validation ciblée proposée

Aucun test n'a été exécuté pour rédiger cette proposition. Après approbation
et implémentation, lancer les suites directement concernées :

```bash
cd backend
npx jest src/auth/auth.service.spec.ts src/auth/auth.password.spec.ts src/realtime/realtime.gateway.spec.ts src/admin-users/admin-users.service.spec.ts --runInBand
npm run typecheck
npm run build
```

Ajouter un test de composition Nest ciblé qui construit les modules Auth et
Realtime et vérifie l'absence de dépendance circulaire, ainsi que l'identité
de l'instance `SessionRevocationService` injectée dans Auth, le gateway et les
consommateurs d'administration via l'export d'AuthModule. Le test ne doit pas
nécessiter une base réelle ni ouvrir un socket réseau.

Relire aussi les diff des fichiers touchés pour confirmer les invariants 1 à
7. Aucun audit global frontend, responsive, accessibilité ou navigateur
n'est nécessaire pour cette tranche backend.

## Retour arrière

La migration est purement modulaire : aucun schéma ni donnée ne change. En cas
d'échec d'initialisation Nest ou de régression des suites ciblées, rétablir les
imports/providers précédents dans les modules Auth et Realtime, restaurer les
imports TypeScript, puis relancer les mêmes contrôles. Le retour arrière ne
requiert aucune migration de données ni intervention de production.

## Décision et gate

Cette ADR est une proposition destinée à la relecture indépendante. Elle ne
consigne pas une décision approuvée et n'autorise pas l'implémentation. La
tranche est structurelle et reste soumise au gate DESIGN-FIRST. Le statut
global de conception et les décisions produit ou conformité hors périmètre
restent inchangés.

### Relecture indépendante ciblée — 2026-11-19

Verdict `PASS` limité aux deux propositions de premier lot de cette ADR et de
`docs/02-architecture.md`. La relecture confirme le découplage Auth/Realtime
proposé, la préservation des invariants, les commandes ciblées et les retours
arrière. Elle confirme également que l'extraction frontend conserve les états,
les événements et le nettoyage des abonnements. Aucun test n'a été exécuté
pendant cette relecture. Ce verdict ciblé ne vaut ni approbation globale de la
conception, ni approbation owner, ni autorisation d'implémenter :
`design-readiness` reste `review` et le gate DESIGN-FIRST reste fermé.

### Orientation du responsable produit — 2026-11-19

Le responsable produit choisit de conserver les décisions métier et conformité
hors de ce work item et d'attendre l'approbation globale de la conception. Le
Goal n'est pas élargi pour traiter ces obligations. La prochaine action est la
reprise de l'implémentation après passage vérifié de
`docs/design/design-readiness.md` à `Status: approved`; jusque-là, aucun code
structurel ni livraison de cette refactorisation n'est autorisé.

Vérification d'attente du 2026-11-19 : la copie distante du fichier sur la
branche `dev` indique encore `Status: review` (GitHub, SHA du contenu
`26d813c2d73e1d5a7371784987aa098145d61dea`). Aucune PR ouverte correspondant
aux recherches « design readiness » et « architecture refactor » n'a été
trouvée. Cette vérification confirme l'attente; elle ne constitue pas une
approbation.
