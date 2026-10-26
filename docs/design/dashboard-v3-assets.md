---
last_updated: 2026-10-26
owner: Mickael MUR
---

# DASH-V3 - Formats et dimensions des assets

Les assets raster générés sont servis avec une taille adaptée à leur usage,
et non avec la résolution brute de génération.

| Asset | Format | Dimensions des fichiers source | Usage |
| --- | --- | ---: | --- |
| `asset/icons/ui/*.png` | PNG RGBA | 1254 × 1254 pour les 29 assets | pictogrammes d'interface; `next/image` optimise les dimensions servies selon la taille CSS |
| `asset/dashboard/illustrations/skkup-icon-*.png` | PNG RGBA | 1254 × 1254 | deux illustrations métier Skkup, affichage réduit selon le composant |
| `asset/dashboard/rewards/reward-art-sprite-v1.png` | PNG | 768 × 768 | sprite de trois cartes, affichage en background 3 colonnes |

Les dimensions ci-dessus ont été contrôlées sur les fichiers présents dans le
dépôt. `asset/` est leur source unique; une route Next les sert directement,
sans dossier `public/`. L'ancien chemin
`frontend/public/branding/generated/skkup-icon-*.png` n'existe pas et ne doit
pas être utilisé comme source. Les proportions et la transparence des illustrations sont
conservées. Les fichiers de référence dans
`docs/design/skkup-dashboard-references/` restent inchangés, car ils servent à
la comparaison visuelle et ne sont pas des assets produits.

La correspondance entre ces illustrations et les routes des dashboards est
décrite dans [dashboard-icon-usage.md](dashboard-icon-usage.md). Ces dimensions
décrivent les fichiers source du dépôt, pas les octets reçus par HTTP. Le pack
runtime actuel contient 29 pictogrammes PNG RGBA de 1254 × 1254 px. `points.png`
est l'image monnaie choisie par le propriétaire, avec son emblème S déjà
intégré à la source. `ticket.png` est rendu seul, sans calque S. Les deux
entrées sont rendues par le composant comme une seule image PNG, sans composite
ou ressource S ajoutée. Le pictogramme cube non rendu a été retiré au profit
de `gift` dans le KPI admin Lots. Les pictogrammes fonctionnels de
navigation restent dans le registre `asset/icons/ui`; les
illustrations métier PNG sont candidates pour les récompenses et l'extension
lorsque le composant dispose d'une surface
suffisante.

## Assets métier servis en production — relevé historique du 2026-10-25

Le fichier `skkup-icon-streak.png` ci-dessous a été retiré du dépôt le
2026-10-26 et remplacé dans le KPI viewer par `asset/icons/ui/flame.png`.
Cette ligne conserve uniquement la preuve des octets observés en production
le 2026-10-25; elle ne décrit pas un asset runtime actuel. La route locale
refuse désormais l'ancien chemin.

Le contrôle initial du 2026-10-25 portait sur sept chemins: chacun répondait
alors en `200 image/png` sur
`https://skkup.fr/assets/dashboard/illustrations/`. Les cinq assets encore
présents dans le checkout à cette date sont listés ci-dessous; après la
migration de la pièce points vers `asset/icons/ui/points.png` et le retrait de
l'ancienne illustration ticket, trois illustrations restent dans ce dossier.
Les octets observés correspondaient
aux fichiers servis selon SHA-256 lors de ce contrôle. Les deux PNG supprimés
du dépôt peuvent encore être servis par la production jusqu'à son prochain
déploiement. Cette preuve historique établit la présence servie à cette date,
pas l'usage des fichiers dans les dashboards.

| Fichier | Octets servis | SHA-256 |
| --- | ---: | --- |
| `skkup-icon-extension-dashboard.png` | 1 421 807 | `98b65edbb21e9b59f0e9d2823b7ff850079e7006e75c2d1376f56e6865f30167` |
| `skkup-icon-points.png` | 1 702 838 | `24a670d71339bb3c98216fc55b4c710c65c7a33eff69b58f745470bd699e2886` |
| `skkup-icon-reward.png` | 1 842 051 | `157bb3056baab4b6fc505401d1ad09919886e0ac57d4b0451de55e8acd9a7abd` |
| `skkup-icon-streak.png` | 1 456 389 | `0d84537718e6f1e10bf5117c4fd9476bcec82639609b47db7f2c6a1ecb633fab` |
| `skkup-icon-ticket-s.png` | 1 571 510 | `d50e5ee5eea6e9a515ef971b281b7928054802a3fb4be120f3afbe1e938575ce` |

Le relevé initial de production incluait deux fichiers depuis supprimés
du dépôt après vérification: `skkup-icon-daily-visit.png` n'avait aucune
correspondance dans les composants ou usages UI, et `skkup-icon-scratch-card.png`
était identique octet pour octet à `skkup-icon-ticket-s.png` sans référence
runtime. Le premier n'a aucun emplacement métier dédié; le second ne constituait
pas une illustration de carte à gratter distincte. Ils ne font plus partie des
assets conservés dans le checkout. Ils peuvent rester disponibles sur la
production jusqu'au prochain déploiement.

## Comparaison des icônes UI entre Docker local et production — 2026-10-26

Les SHA-256 ci-dessous proviennent des octets récupérés par HTTP le
2026-10-26: sur Docker local à `http://127.0.0.1:3000/assets/` et sur le site
public à `https://skkup.fr/assets/`. Ils attestent des fichiers image servis
sur ces chemins au moment du contrôle. Les différences de hash pour `streams`
et `points` indiquent que les nouveaux fichiers locaux ne sont pas ceux servis
en production lors de ce relevé. Aucun déploiement de ces modifications n'est
établi ici.

| Asset et chemin public | SHA-256 production | SHA-256 Docker local | Comparaison |
| --- | --- | --- | --- |
| [`streams.png`](https://skkup.fr/assets/icons/ui/streams.png) / [Docker](http://127.0.0.1:3000/assets/icons/ui/streams.png) | `064d984f19c0907eafbf99eff0a6c9d2f272c51339f4d4d16eabf2f1b6521065` | `1f4d0d63dbbe3c905608b012af7860e21ba50600eebed03197434c184b0cf2a7` | Différents |
| [`points.png`](https://skkup.fr/assets/icons/ui/points.png) / [Docker](http://127.0.0.1:3000/assets/icons/ui/points.png) | `24a670d71339bb3c98216fc55c4b710c65c7a33eff69b58f745470bd699e2886` | `211758f72723ffe7d409574733e6259a8b63a57ddfab0c633defce029fb22f2b` | Différents |
| [`flame.png`](https://skkup.fr/assets/icons/ui/flame.png) / [Docker](http://127.0.0.1:3000/assets/icons/ui/flame.png) | `047180ac2ca48b339f8a8f06d5ac09f665b435d2dcfc33705a30dcf21757ea10` | `047180ac2ca48b339f8a8f06d5ac09f665b435d2dcfc33705a30dcf21757ea10` | Identiques |
| [`skkup-icon-streak.png`](https://skkup.fr/assets/dashboard/illustrations/skkup-icon-streak.png) | `0d84537718e6f1e10bf5117c4fd9476bcec82639609b47db7f2c6a1ecb633fab` | Retiré du dépôt et absent du runtime local | L'ancien fichier reste servi en production lors du relevé |

La page HTML de production n'expose ni hash des assets ni identifiant/SHA de
build. Cette comparaison prouve les hashes des quatre chemins d'assets, mais
ne permet pas d'identifier le commit ou le build actuellement déployé.
