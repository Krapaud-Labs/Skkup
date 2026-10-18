# Revalidation unitaire P0 - 2026-10-18

## Provenance et intégrité

Les deux rapports bruts ci-dessous ont été produits dans le worktree isolé
`/private/tmp/skkup-mvp001-20261018`, sur le code à `HEAD 6d9cc76`. Ce SHA est
distinct de la branche documentaire de ce dossier, basée sur `dev` à
`8f4795d` après fusion des PR #413 et #414. La comparaison
`6d9cc76..8f4795d` ne contient aucun fichier modifié dans `backend/`,
`frontend/` ou `extension/`; `6d9cc76` est l'environnement de test, pas la
tête de la branche documentaire.

| Rapport | Taille | SHA-256 |
| --- | ---: | --- |
| [`jest-results.json`](jest-results.json) | 121629 octets | `eb0f74915bce9754020bc252e1e928cd8bafbf481049a0299db50cea272eabea` |
| [`frontend-vitest-results.json`](frontend-vitest-results.json) | 77437 octets | `2ec4962a7cf37705f468a51490a16a2a1033451d4db06b30ba760736a15d2a6c` |

Les SHA-256 et tailles ont été vérifiés contre les fichiers sources avant
l'archivage. L'inspection des champs, chemins et intitulés de tests n'a révélé
aucune valeur de secret ou donnée d'authentification; les rapports ne
contiennent aucun message d'échec. Les chemins absolus de provenance sont
conservés dans les rapports Jest tels que générés.

## Backend

Depuis `backend/`, commande exécutée :

```bash
npm test -- --runInBand --silent
```

Résultat : code 0; 44/44 suites et 296/296 tests réussis; 0 échec, 0 test
pending et 0 test todo. Versions observées : Node.js 26.10.0, npm 11.19.1,
Jest 30.4.2 et Prisma / `@prisma/client` 7.10.0. La génération du client
Prisma 7.10.0 a réussi avant cette exécution avec :

```bash
cache_tmp=$(mktemp -d /private/tmp/skkup-prisma-cache.XXXXXX)
XDG_CACHE_HOME="$cache_tmp" ./node_modules/.bin/prisma generate --schema prisma/schema.prisma
```

Les versions sont issues des sorties `node --version`, `npm --version` et
`npm ls jest prisma @prisma/client --depth=0`. Le shell a rendu le code de
sortie 0 pour la génération et les deux exécutions Jest; les JSON ci-joints
confirment les comptes et leur champ `success`, mais ne stockent pas les
commandes ni le code de sortie du shell.

Un second run a conservé le rapport JSON brut avec la commande
`npm test -- --runInBand --silent --json --outputFile=/private/tmp/skkup-mvp001-backend-jest-summary-20261018.json`;
il a également terminé avec le code 0 et les mêmes comptes.

Les suites réussies rattachées par leur chemin au périmètre des stories sont :

| Story | Suites présentes dans le JSON | Résultat |
| --- | --- | ---: |
| US-001 | Aucune suite backend directement attribuable; cette story porte sur la vitrine, la FAQ et le légal. | Non applicable au run backend |
| US-002 | `auth.service`, `auth.password`, `auth.controller`, `auth/dto/register.dto`, `auth/oauth-facebook.service`, `auth/oauth-google.service`, `auth/oauth-twitch.service`, `auth/strategies/jwt.strategy`, `auth/oauth-token-crypto` | 9 suites, 50 tests |
| US-003 | `extension.service`, `extension-auth.guard`, `jetons-extension` | 3 suites, 32 tests |
| US-004 | `watch-sessions.service`, `watch-session-credential.guard` | 2 suites, 27 tests |
| US-005 | `me.controller`, `me.service` | 2 suites, 25 tests |
| US-006 | `raffles.service`, `raffles.controller`, `raffle-draw`, `tirage`, `raffles/dto/create-raffle.dto` | 5 suites, 53 tests |
| US-007 (P1, hors P0) | `fraud-flags.service`, `admin-users.service` | 2 suites, 4 tests |
| Transverses / non attribuées à une story dans ce relevé | 21 autres suites listées dans le JSON | 105 tests |

Cette répartition est un index des suites par domaine de fichiers, pas une
revue de chaque assertion ni une déclaration de couverture complète des
critères métier. En particulier, les tests `me` ne suffisent pas à démontrer
les seuils de récompenses si aucune assertion dédiée ne les couvre.

## Frontend

Depuis `frontend/`, commande exécutée :

```bash
npm test -- --reporter=json --outputFile=/private/tmp/skkup-mvp001-frontend-vitest-20261018.json
```

Résultat : code 0; Vitest 4.1.11, Node.js 26.10.0 et npm 11.19.1; 88/88 suites,
231 tests réussis sur 237, 6 tests skipped et 0 échec. Les six tests skipped
de `TableauDeBord.test.tsx` correspondent à l'état `pending` dans le JSON brut
et sont :

- affiche les annonces publiques sans modifier leur contenu;
- ouvre une annonce dans une modale accessible;
- expose l'action métier principale avec un nom clavier explicite;
- annonce une indisponibilité du flux des annonces;
- affiche le chargement indépendant des annonces;
- retire l'erreur des annonces après une reprise réussie.

Ces tests unitaires Vitest ne prouvent ni navigation dans un navigateur ni
rendu visuel du produit. Les six skipped laissent explicitement ouverts les
scénarios Notifications/annonces et modal; ils ne sont pas comptés comme des
réussites.

Le shell a rendu le code de sortie 0; le JSON confirme le compte `success`, les
88 suites et les états des assertions, mais ne contient pas la commande ni le
code de sortie. Les versions proviennent de `node --version`, `npm --version`
et `npm ls vitest --depth=0`.

## Portée et limites

Ces résultats sont des tests unitaires isolés sur un worktree dédié. Ils ne
prouvent pas une requête HTTP réelle, une intégration ou persistance en base,
l'usage de PostgreSQL, Redis ou BullMQ, un parcours E2E, un rendu navigateur,
une authentification en production, ni l'acceptation des critères métier. La
génération Prisma et le succès Jest ne constituent pas une preuve de base de
données démarrée ou utilisée. Les suites skipped restent à traiter.

Aucun statut `needs-review` ou `review` n'est modifié par ces rapports; ils ne
valent ni approbation du design ni clôture de MVP-001.
