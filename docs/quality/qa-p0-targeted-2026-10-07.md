# Vérification QA ciblée des preuves P0

Date : 2026-10-07
Work item : `2026-10-03-initialisation-reprise`
Verdict QA : résultats locaux positifs dans le périmètre exécuté, sans fermeture de story ni de gate.

## Environnement et commandes

Le déploiement Docker n'était pas accessible dans cette session :

```text
docker compose ps
permission denied while trying to connect to the Docker API
unix:///Users/krapaud/.docker/run/docker.sock
```

La suite Playwright locale a été relancée avec les permissions d'exécution
nécessaires, sans modification du produit :

```bash
cd frontend
npx playwright test e2e/responsive-accessibility.spec.ts --project=desktop
```

Résultat : **11 tests réussis**. La couverture observée inclut la vitrine,
les routes `/dashboard` et `/admin`, l'absence de débordement horizontal,
les contrôles nommés et atteignables au clavier, les contrastes ciblés,
les viewports 320/768/1280 et la validation automatique de la visite à la
connexion.

La suite backend ciblée a été exécutée ainsi :

```bash
cd backend
npm test -- --runInBand \
  src/auth/auth.service.spec.ts \
  src/auth/auth.controller.spec.ts \
  src/extension/extension-auth.guard.spec.ts \
  src/watch-sessions/watch-session-credential.guard.spec.ts \
  src/me/me.service.spec.ts \
  src/scratch-cards/scratch-cards.service.spec.ts \
  src/raffles/raffles.controller.spec.ts \
  src/raffles/raffles.service.spec.ts \
  src/admin-users/admin-users.service.spec.ts \
  src/admin-lots/admin-lots.service.spec.ts
```

Résultat : **10 suites réussies, 87 tests réussis, 0 échec**.

Une seconde exécution backend complète a ensuite été réalisée hors sandbox le
8 octobre 2026 pour lever la limitation `listen EPERM` observée lors d'une
exécution confinée :

```bash
cd backend
npm test -- --runInBand
```

Résultat : **43 suites réussies, 288 tests réussis, 0 échec**. Les journaux
attendus couvrent notamment les refus d'accès administrateur, les tokens
invalides, la révocation et la limitation des connexions WebSocket.

La suite frontend complète a également été exécutée hors sandbox le 8 octobre
2026 :

```bash
cd frontend
npm test -- --run
```

Résultat : **32 fichiers réussis, 120 tests réussis, 6 tests ignorés**. Les
tests ignorés restent des scénarios conditionnés par une cible QA authentifiée.

Le mode local `QA_STORAGE_STATE` a ensuite été vérifié avec le compose override
qui publie le frontend sur `127.0.0.1:3000` et le backend sur
`127.0.0.1:3001`. La session existante est bien chargée par Playwright, mais
les 56 scénarios live restent non concluants : la base Docker recréée ne
correspond plus à la session stockée et l'interface affiche
« Impossible de charger ton espace Skkup ». Cette exécution n'est donc pas
présentée comme une validation métier authentifiée.

## Limites

Ces résultats renforcent les preuves techniques locales, mais ne remplacent
pas un déploiement Docker accessible, une preuve navigateur live authentifiée,
la couverture indépendante de chaque story P0, ni l'audit indépendant attendu.
Les stories US-001 à US-006 restent donc `needs-review`.

## Reprise QA Docker locale du 8 octobre 2026

Un compte viewer QA éphémère a été créé uniquement dans la base Docker locale.
Le déploiement HTTPS local a été reconstruit avec le préfixe API `/api` et le
parcours authentifié a été rejoué sans interception réseau :

```bash
QA_BASE_URL=https://localhost \\
QA_STORAGE_STATE=e2e/test-results/qa-viewer-storage.json \\
QA_LOCAL_HTTPS=1 \\
npx playwright test e2e/dashboard-viewer-main-live.spec.ts
```

Résultat : **4 tests réussis, 0 échec**, sur les projets desktop et mobile,
aux viewports 320 et 1280. La cause corrigée était la normalisation de
`NEXT_PUBLIC_API_URL` qui supprimait à tort le chemin `/api`, provoquant des
appels `/me` en 404 derrière le reverse proxy HTTPS. La fonction conserve
désormais le préfixe de chemin configuré.

## Campagne live P0 complète du 8 octobre 2026

Le Docker local HTTPS a été vérifié healthy avec deux sessions QA éphémères,
viewer et admin. La session admin a été utilisée uniquement pour les routes
`/admin`; aucun compte ni secret n'est destiné à la production.

```bash
QA_BASE_URL=https://localhost \\
QA_STORAGE_STATE=e2e/test-results/qa-admin-storage.json \\
QA_LOCAL_HTTPS=1 \\
npx playwright test e2e/dashboard-v3-secondary-live.spec.ts \\
  e2e/dashboard-responsive-live.spec.ts --project=desktop
```

Résultat initial : **61/62 réussis**, avec un seul `ERR_NETWORK_IO_SUSPENDED`
transitoire sur `/admin/announcements` pendant le démarrage d'une navigation.
Le rejeu ciblé immédiat du même scénario a réussi : **62/62 validés**.
La campagne couvre les routes viewer et admin aux viewports 320, 768 et 1280,
les états reduced-motion, l'absence de débordement, les contrôles nommés,
le clavier, les images et le zoom 200 %.
