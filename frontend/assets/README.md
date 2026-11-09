# Assets Skkup

Ce dossier est la source canonique des images, logos et icônes produit. Le site
sert ses médias directement depuis `frontend/assets/`. Le paquet de l'extension copie ses
icônes et son logo vers `extension/dist/` au build.

## Où trouver les fichiers

| Dossier | Contenu |
| --- | --- |
| `brand/logos/` | Wordmarks utilisés par le site |
| `brand/marks/` | S Skkup, favicon et icônes de navigateur |
| `brand/source/` | Fichiers source et variantes conservées de la marque |
| `icons/ui/` | 29 PNG utilisés dans les écrans; le S est intégré à l'image source de points, sans calque superposé |
| `dashboard/illustrations/` | Illustration métier d’extension; l’ancienne illustration de récompense a été retirée du runtime le 2026-11-03 |
| `dashboard/rewards/` | Sprite des récompenses du dashboard |
| `platforms/` | Logos PNG runtime Twitch, YouTube et Kick; sources SVG Twitch et YouTube |
| `marketing/hero/`, `marketing/steps/` | Images de la vitrine |
| `extension/brand/`, `extension/icons/` | Images et icônes incorporées au paquet extension |
| `extension/store/` | Visuels promotionnels de la fiche extension |

Les captures de tests et les images de référence documentaire restent près de
leurs preuves dans `docs/`; elles ne sont pas des médias runtime du produit.

## Génération des copies runtime

- `cd frontend && npm run dev` et `npm run build` servent les routes `/assets/*`
  depuis la racine `frontend/assets/` avec un gestionnaire Next dédié. Aucun dossier
  `public/` n'est nécessaire pour les médias.
- `cd extension && npm run build` copie les logos et icônes du paquet dans
  `dist/` depuis ce dossier.
- `extension/dist/` est une sortie générée et n'est pas un emplacement source
  à modifier.

L'arborescence complète et les correspondances entre source et URL web sont
décrites dans [docs/design/media-inventory.md](../../docs/design/media-inventory.md).

Le pack UI contient 22 pictogrammes renouvelés et sept nouveaux glyphes PNG.
Le ticket et la pièce points sont des PNG 3D dans `icons/ui/`; le S est intégré
à l'image points, tandis que le ticket est rendu seul. Le composant `SkkupIcon`
n'ajoute pas de monogramme en superposition. Le KPI de série utilise `flame`;
l'ancienne illustration de série a été retirée. Les écrans chargent les icônes
via `SkkupIcon` et `/assets/*`.

Depuis le 2026-11-09, les 29 PNG du registre `SkkupIcon` sont rendus en niveaux
neutres blanc/argent. Le traitement garde les dimensions 1254 × 1254, les
silhouettes, les détails de luminance et l’alpha d’origine; il ne recolore ni
les logos de marque/plateformes ni les illustrations séparées. Exception de
marque demandée le 2026-11-09 : les quatre actifs de navigateur dans
`brand/marks/` utilisent l’image Skkup fournie par le propriétaire. Les trois
PNG gardent le fichier RGBA 1254 × 1254 inchangé; `favicon.ico` contient cette
même image redimensionnée en PNG 64 × 64 à l’intérieur du conteneur ICO. Cette
marque violet/rose n’est pas recolorée avec les pictogrammes UI. Les quatre
fichiers antérieurs sont conservés dans
`../../docs/archive/design/brand-marks-before-owner-art-2026-11-09.tar.gz`.
La méthode
reproductible est `frontend/scripts/recolor-ui-icons-neutral.mjs`. Les fichiers
originaux byte-identiques sont archivés hors des assets servis dans
`docs/archive/design/ui-icons-before-neutral-2026-11-09.tar.gz`.
