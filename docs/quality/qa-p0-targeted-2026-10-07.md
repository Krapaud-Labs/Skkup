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

## Limites

Ces résultats renforcent les preuves techniques locales, mais ne remplacent
pas un déploiement Docker accessible, une preuve navigateur live authentifiée,
la couverture indépendante de chaque story P0, ni l'audit indépendant attendu.
Les stories US-001 à US-006 restent donc `needs-review`.
