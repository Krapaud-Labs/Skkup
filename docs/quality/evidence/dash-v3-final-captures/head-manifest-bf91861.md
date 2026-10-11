# Manifeste de campagne DASH-V3

Date: 2026-10-11

## Référence

- Branche: `chore/dash-v3-final-design-1-16-30`
- HEAD: `bf91861261e77e134b734e8134dd6fb959d54533`
- Commit: `docs(qa): define consolidated dash v3 audit campaign`
- CI précédente du parent: run `38135295267`, SUCCESS
- Vérification avant push: SUCCESS

## Environnement Docker local relu

Tous les services sont `running` et `healthy` au moment de la collecte:

| Service | Image | ID |
| --- | --- | --- |
| backend | `skkup-backend:latest` | `94f169901a90` |
| frontend | `skkup-frontend:latest` | `8ae864270c5f` |
| migrate | `skkup-migrate:latest` | `0d2f4b73f965` |
| postgres | `postgres:16-alpine` | `721873c34ceb` |
| proxy | `traefik:v3.7.1` | `6b9cbca6fac4` |
| redis | `redis:7-alpine` | `858f009f9709` |
| worker | `skkup-worker:latest` | `b00cde830283` |

Ce manifeste ferme uniquement la traçabilité locale de la campagne. Il ne
ferme pas les preuves externes encore ouvertes: pairing Web Store sur la même
cible, reconnexion navigateur après incident Redis, rollback/restauration
distante et décision indépendante sur les 13 références design.
