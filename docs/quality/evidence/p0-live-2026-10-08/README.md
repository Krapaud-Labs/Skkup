# Artefacts bruts de la campagne P0 live

Date : 2026-10-08  
Cible : Docker local HTTPS `https://localhost`  
Branche : `chore/kit-1-16-27-initialisation`
Référence Git : **HEAD `aebcfcc` de `chore/kit-1-16-27-initialisation` au moment de la relecture**.
L’archive est versionnée avec le dépôt et sa provenance est vérifiable par
`git log -- docs/quality/evidence/p0-live-2026-10-08`.

La campagne Playwright authentifiée a validé **62/62 scénarios** après le
rejeu ciblé de `/admin/announcements` à 1280 px, initialement interrompu par
`ERR_NETWORK_IO_SUSPENDED`. Le compte admin utilisé était éphémère et local au
Docker; aucun secret n'est conservé dans ce dossier.

Le rapport brut scénario par scénario est conservé dans
`playwright-report.json` : `expected=62`, `unexpected=0`, `flaky=0`.

Le rapport brut backend est conservé dans `backend-jest-report.json` :
**43 suites et 288 tests réussis**, avec les refus d'accès admin, les tokens
invalides, la révocation et les limites WebSocket observés dans les journaux.

Commande reproductible :

```bash
cd frontend
QA_BASE_URL=https://localhost \
QA_STORAGE_STATE=e2e/test-results/qa-admin-storage.json \
QA_LOCAL_HTTPS=1 \
npx playwright test e2e/dashboard-v3-secondary-live.spec.ts \
  e2e/dashboard-responsive-live.spec.ts --project=desktop
```

Couverture : routes viewer et admin, viewports 320/768/1280, reduced motion,
absence de débordement, contrôles nommés et atteignables au clavier, images,
zoom 200 % et liens internes.

Le PNG voisin est l'artefact brut conservé du scénario rejoué. Le rapport JSON
contient le résultat brut de chaque scénario; les résultats restent
reproductibles par la commande ci-dessus et sont référencés dans
`docs/quality/qa-p0-targeted-2026-10-07.md`.
