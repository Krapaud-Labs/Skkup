# Preuves reproductibles de validation locale

Date de collecte : 2026-10-03, Europe/Paris

| Contrôle | Commande | Résultat observé | Limite |
|---|---|---|---|
| Typecheck backend | `cd backend && npm run typecheck` | réussi | aucune |
| Typecheck frontend | `cd frontend && npm run typecheck` | réussi | aucune |
| Typecheck extension | `cd extension && npm run typecheck` | réussi | aucune |
| Tests backend | `cd backend && npm test -- --runInBand` | 39 suites, 275 tests réussis dans l'environnement autorisé | `listen EPERM` dans la sandbox |
| Tests frontend | `cd frontend && npm test` | 25 fichiers, 93 tests réussis | aucune |
| Tests extension | `cd extension && npm test` | 10 fichiers, 59 tests réussis | aucune |
| Build backend | `cd backend && npm run build` | réussi | aucune |
| Build frontend | `cd frontend && npx next build --webpack` | compilation réussie, 23 pages générées | Turbopack échoue sur une liaison de port, QJ-003 |
| Build extension | `cd extension && npm run build` | réussi | aucune |
| Diff | `git diff --check dev...HEAD` | réussi | branche dédiée |
| Index consommateur | `bash .codex/scripts/verify-consumer-index.sh` | réussi | aucune |
| Preflight après correction | `bash .codex/scripts/preflight.sh` | contrôle technique réussi jusqu'à la porte design | `design-readiness.md` reste `draft`, donc le script refuse encore l'approbation |
| Socle sécurité après correction | `bash .codex/scripts/security-baseline.sh` | `Socle cybersécurité OK` | aucun audit indépendant de production |
| E2E responsive live sans secrets | `QA_BASE_URL=https://skkup.fr npm run test:e2e:responsive-live` | 12 tests explicitement ignorés | `QA_EMAIL` et `QA_PASSWORD` absents; aucune capture authentifiée produite |
| E2E responsive local | `npm run test:e2e:responsive-live` | échec avant exécution | sandbox interdit la liaison `127.0.0.1:3000` |
| Contrôle sécurité avec runtime Python 3.12 | `PATH=/Users/krapaud/Documents/Projets/Kovaris/.venv/bin:$PATH bash .codex/scripts/security-baseline.sh` | `Socle cybersécurité OK` | Python 3.12.14 trouvé localement; aucun fichier de cet environnement modifié |
| Preflight avec runtime Python 3.12 | `PATH=/Users/krapaud/Documents/Projets/Kovaris/.venv/bin:$PATH bash .codex/scripts/preflight.sh` | atteint la porte `Status: approved`, puis échoue car `design-readiness.md` est encore `draft` | contrôle technique exécutable; approbation volontairement non simulée |
| Obligations | `PATH=/Users/krapaud/Documents/Projets/Kovaris/.venv/bin:$PATH bash .codex/scripts/validate-obligations.sh .codex/work-items/2026-10-03-initialisation-reprise/obligations.tsv` | `audit-gate needs-review`; `delivery-gate pending` | gates encore ouverts après relance |
| Docker local | `docker compose up -d --build` puis `docker compose ps` | images backend/frontend/worker/migrate construites; services healthy; migration terminée | environnement local isolé, aucun déploiement de production |
| E2E responsive authentifié Docker | `QA_BASE_URL=http://localhost:3000 QA_EMAIL=... QA_PASSWORD=... npm run test:e2e:responsive-live` | 6 tests réussis aux viewports 320/768/1280 pour `/dashboard` et `/admin`; 6 tests mobile redondants ignorés | compte et fixture QA locaux opt-in; aucune donnée de production |
| Sauvegarde/restauration PostgreSQL locale | `pg_dump --format=custom` puis `pg_restore` dans `skuup_restore` temporaire | archive de 63K créée; restauration terminée; inventaire restauré avec `_prisma_migrations`, `users`, `raffles`, `streams` et autres tables applicatives | base temporaire locale supprimable; aucun volume de production utilisé |
| Configuration Dokploy et exploitation locale | `docker compose -f docker-compose.dokploy.yml config --quiet`, `docker compose ps --all`, logs `migrate` | configuration valide; backend/frontend/postgres/redis/worker healthy; migration terminée sans migration en attente | configuration inspectée sans déploiement distant |
| Tests backend ciblés P0 | `cd backend && npm test -- --runInBand src/auth src/extension src/watch-sessions src/me src/realtime src/scratch-cards src/streams src/raffles src/admin-lots src/admin-users src/common/throttler.guards.spec.ts` | 31 suites, 247 tests réussis; refus administrateur observés dans les logs | preuve locale reproductible; relecture indépendante et preuve de livraison encore requises |

Ces résultats sont des preuves de commandes et ne valent pas approbation indépendante de la conception ni validation de Pull Request.
