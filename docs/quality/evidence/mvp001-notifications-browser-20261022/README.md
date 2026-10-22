# Preuves navigateur Notifications viewer

Ce dossier regroupe les captures et la trace du contrôle Chromium local du dialogue Notifications viewer. Le run final vérifie le clic sur le backdrop, le maintien du focus, le confinement clavier, Escape, la fermeture explicite et l’absence de débordement horizontal.

## Exécution

Le test utilise un serveur Next.js local et des réponses API simulées par Playwright. Il n’utilise aucun compte réel ni service externe. Le fixture temporaire est conservé dans `/private/tmp/skkup-browser-qa/notifications.spec.ts`; la configuration est `/private/tmp/skkup-browser-qa/playwright.config.mjs`.

Commande exécutée depuis `frontend/` lors de la session:

```sh
npx playwright test --config=/private/tmp/skkup-browser-qa/playwright.config.mjs
```

Le run accepté a terminé `1 passed (2.8s)` sur Chromium, avec les viewports
1280×850, 390×850 et 320×850. Le fixture et la configuration Playwright étaient
temporaires sous `/private/tmp` et ne sont pas livrés dans ce dossier; la
commande ci-dessus documente l'exécution effectuée, mais il faut recréer ce
fixture pour la rejouer depuis un autre environnement.

Sources frontend exactes testées (modifications locales non commitées pendant
le run):

- `frontend/src/components/dashboard/TopbarDashboard.tsx` — SHA-256
  `26a1a504d87f129a9058fd6cc30e19896063cec2d0ae8ba449da3d8b0cf3f053`.
- `frontend/src/components/dashboard/TopbarDashboard.test.tsx` — SHA-256
  `52f9d18f317bf11063cb8d3dfe4fefcd998cb10a535b7f5f1153715a631c3a2a`.

## Artefacts

- `notifications-1280-backdrop-verified.png`, `notifications-390-backdrop-verified.png`, `notifications-320-backdrop-verified.png`: dialogue toujours ouvert et focus conservé après clic hors du dialogue.
- `trace-backdrop-verified.zip`: trace Playwright du run complet. Pour la consulter, utiliser `npx playwright show-trace trace-backdrop-verified.zip`.
- Les fichiers `trace-backdrop-focus-rework.zip` et `backdrop-focus-rework-error-context.md` conservent le résultat antérieur où le backdrop laissait échapper le focus, avant le correctif frontend.

Empreintes SHA-256 des preuves du run accepté:

- `notifications-1280-backdrop-verified.png`: `b522b5b5bfaf4cfda59119a53902fc57f702a5548ff011fcc26f156a7486b813`.
- `notifications-390-backdrop-verified.png`: `4f6d91a18a9903e2e732a0e093ef23088ba7bd29b41629c18464dfd326d6ea1c`.
- `notifications-320-backdrop-verified.png`: `f81f36656d2de0844c099b12d5fafee04dc5e67f673774ef21a7af0fcc480481`.
- `trace-backdrop-verified.zip`: `b83ad5c3a1ddcdec9501700915960f0898356607681d59b8b120f6cb92163bee`.

## Portée et limites

La vérification porte sur les empreintes source ci-dessus. Le HEAD était égal à `origin/dev` (`70aa0183d8602ccca9d50cff05dad6c4edca9270`), mais les deux fichiers frontend testés contenaient des changements locaux non commités pendant l’exécution. Il s’agit d’un serveur de développement, pas d’un build de production ou d’un site déployé.

Ce résultat valide le critère modal backdrop/focus pour l’état de code décrit dans le rapport. Il ne remplace pas les autres gates MVP-001 ni une approbation globale de livraison.
