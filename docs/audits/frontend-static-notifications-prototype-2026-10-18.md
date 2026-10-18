# Revue statique frontend du prototype Notifications - 2026-10-18

## Verdict et portée

**Verdict : `needs-review`.** Cette revue est statique et en lecture seule.
Elle porte uniquement sur le prototype documentaire Notifications, pas sur le
dashboard produit, ses composants frontend, son API ou son déploiement. Aucun
fichier source du prototype n'a été modifié pendant l'audit.

Sources inspectées dans le worktree isolé :

- `docs/design/evidence/notifications-modal-concept/index.html`
- `docs/design/evidence/notifications-modal-concept/prototype.js`
- `docs/design/evidence/notifications-modal-concept/styles.css`
- `docs/design/evidence/notifications-modal-concept/README.md`
- `frontend/src/app/design-tokens.css` pour comparer les couleurs déclarées

Le contexte de conception et les limites produit ont été rapprochés de
`docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md`.

## Méthode et commandes

Lecture des sources avec `sed` et `nl`; recherche des attributs et règles CSS
avec `rg`. Contrôle d'état initial avec `git status --short`. Calcul des ratios
de contraste par un petit script Node utilisant les couleurs hex opaques
déclarées et la formule de luminance relative WCAG. Inventaire des règles
responsive applicables à 320, 768 et 1280 px avec un script Python lisant les
seuils `@media` du fichier CSS. `git diff --check` a été exécuté sans erreur.

Playwright est présent dans les dépendances frontend, mais aucun test E2E,
navigateur, serveur local, DOM exécuté, session BrowserAct ni technologie
d'assistance n'a été utilisé. Aucun outil n'a mesuré les boîtes ou le
débordement rendu.

## Constats statiques

### Sémantique et noms accessibles

- Le bouton cloche est un bouton nommé `Notifications`, avec
  `aria-expanded` et `aria-controls`.
- Le panneau est nommé par son titre `Notifications`; les annonces sont des
  boutons dont le titre visible fournit le nom. Les icônes décoratives ont
  `aria-hidden="true"`.
- Le dialogue porte `role="dialog"`, `aria-modal="true"`, et référence son
  titre et son corps via `aria-labelledby` et `aria-describedby`. Le bouton de
  fermeture a un nom accessible explicite.
- Le document déclare `lang="fr"`; la navigation et le lien d'évitement ont des
  libellés. Les états dynamiques utilisent `role="status"` ou `role="alert"`.

Ces attributs sont présents dans la source. La restitution effective des noms,
des changements d'état et du dialogue par un lecteur d'écran n'a pas été
vérifiée.

### Clavier et focus

- L'ouverture d'une annonce renseigne le titre et le corps puis appelle
  `dialog.focus()`.
- `focusableInDialog()` recherche boutons, liens et éléments tabindex visibles
  selon `getClientRects()`. Le gestionnaire `Tab`/`Maj+Tab` boucle entre les
  limites calculées et renvoie le focus au dialogue si aucun élément focusable
  n'est trouvé.
- La fermeture appelle `focus()` sur le déclencheur d'annonce s'il est encore
  connecté, sinon sur la cloche.
- Limite repérée dans le code : le gestionnaire ne redirige pas un focus situé
  sur un élément extérieur intermédiaire; il ne traite que le dialogue, le
  premier et le dernier focusable. La source seule ne démontre donc pas un
  confinement runtime pour tous les chemins de tabulation.
- La cloche gère `ArrowDown` pour ouvrir le menu et tenter de focaliser la
  première annonce après un délai. Les contrôles restent des boutons natifs.

Les appels de focus, la visibilité DOM, l'ordre réel de tabulation et la
restauration n'ont pas été exécutés dans un DOM ou un navigateur.

### Escape et arrière-plan inerte

- Le code ferme le dialogue sur `Escape`, retire `inert` de `#app-shell` et
  restaure le focus selon le déclencheur encore connecté.
- Le dialogue est placé hors de `#app-shell`, auquel `inert` est appliqué à
  l'ouverture.
- `Escape` ferme également le menu lorsqu'il est ouvert sans dialogue. Aucun
  gestionnaire de clic de fermeture sur le voile n'apparaît dans le JS.

Ces constats décrivent les branches présentes, pas leur effet réel dans un
navigateur ou avec les technologies d'assistance.

### Contrastes calculables depuis les couleurs source

Ratios calculés pour des paires opaques déclarées, sans composition de pixels :

| Premier plan / arrière-plan | Ratio calculé |
| --- | ---: |
| Texte primaire `#f5f3ff` / page `#07132d` | 16,79:1 |
| Texte secondaire `#b8c3e8` / page `#07132d` | 10,53:1 |
| Texte secondaire `#b8c3e8` / token surface élevée `#122955` | 8,15:1 |
| Corps modal `#d0d9f3` / début du gradient modal `#142b57` | 9,85:1 |
| Eyebrow `#a797ff` / page `#07132d` | 7,47:1 |
| Note `#8f9fc7` / page `#07132d` | 6,97:1 |
| Cyan `#16d9ff` / page `#07132d` | 10,88:1 |
| Cyan `#16d9ff` / surface élevée `#122955` | 8,41:1 |

Les ratios ne sont pas une mesure des couleurs rendues. Les gradients, fonds
avec alpha, opacités, voile, flou, bordures et états interactifs peuvent
modifier les couleurs effectives; aucun contraste complet ni conformité
globale n'est validé par ces calculs.

### Responsive et risques de débordement

Règles media applicables selon les seuils source : 320 px active les règles
`max-width: 900px`, `700px` et `380px`; 768 px active `max-width: 900px`; 1280
px reste sur les règles de base.

La source déclare `body { min-width: 320px }`, borne la largeur du menu par le
viewport, fixe le menu à droite sur petit écran, réduit les marges du modal
sous 380 px et applique `overflow-wrap: anywhere` au titre et au corps du
dialogue. Le dialogue a un `max-height` lié au viewport et `overflow-y: auto`;
le menu déclare `overflow: hidden`.

Points à vérifier dans un rendu ultérieur : ajustement de la topbar et des
éléments flex à 320 px, placement du menu fixé sous la topbar, défilement du
dialogue long et absence de débordement horizontal. Aucun calcul de layout,
`scrollWidth`, capture ou mesure de viewport n'a été effectué; l'absence de
débordement à 320/768/1280 px n'est pas établie.

### Mouvement réduit

Une règle `@media (prefers-reduced-motion: reduce)` neutralise le défilement
fluide et réduit durée d'animation et de transition à `0.01ms`, avec une seule
itération. C'est une vérification de présence dans la source; le comportement
du navigateur avec cette préférence n'a pas été observé.

## Limites et état

Cette revue n'a exécuté aucun DOM, aucun navigateur, aucune capture, aucun
lecteur d'écran, aucun contrôle de géométrie ni parcours produit. Le prototype
reste statique et à données fictives; ses interactions décrites dans le code
ne prouvent pas le comportement du produit, l'API viewer, ni le rendu visuel.
Les critères visuels, responsive, clavier et accessibilité d'ADR-011 demeurent
à vérifier de manière appropriée. Le verdict reste `needs-review` et ne vaut
pas approbation du design ni readiness produit.
