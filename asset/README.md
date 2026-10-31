# Assets Skkup

Ce dossier est la source canonique des images, logos et icônes produit. Le site
sert ses médias directement depuis `asset/`. Le paquet de l'extension copie ses
icônes et son logo vers `extension/dist/` au build.

## Où trouver les fichiers

| Dossier | Contenu |
| --- | --- |
| `brand/logos/` | Wordmarks utilisés par le site |
| `brand/marks/` | S Skkup, favicon et icônes de navigateur |
| `brand/source/` | Fichiers source et variantes conservées de la marque |
| `icons/ui/` | 29 PNG utilisés dans les écrans; la source monnaie fournie pour les points contient un S, sans preuve que l'asset runtime actuel lui soit identique |
| `dashboard/illustrations/` | Illustrations métier récompenses et extension |
| `dashboard/rewards/` | Sprite des récompenses du dashboard |
| `platforms/` | Logos PNG runtime et sources SVG des plateformes |
| `marketing/hero/`, `marketing/steps/` | Images de la vitrine |
| `extension/brand/`, `extension/icons/` | Images et icônes incorporées au paquet extension |
| `extension/store/` | Visuels promotionnels de la fiche extension |

Les captures de tests et les images de référence documentaire restent près de
leurs preuves dans `docs/`; elles ne sont pas des médias runtime du produit.

## Génération des copies runtime

- `cd frontend && npm run dev` et `npm run build` servent les routes `/assets/*`
  depuis la racine `asset/` avec un gestionnaire Next dédié. Aucun dossier
  `public/` n'est nécessaire pour les médias.
- `cd extension && npm run build` copie les logos et icônes du paquet dans
  `dist/` depuis ce dossier.
- `extension/dist/` est une sortie générée et n'est pas un emplacement source
  à modifier.

L'arborescence complète et les correspondances entre source et URL web sont
décrites dans [docs/design/media-inventory.md](../docs/design/media-inventory.md).

Le pack UI contient 22 pictogrammes renouvelés et sept nouveaux glyphes PNG.
Le ticket et la pièce points sont des PNG 3D dans `icons/ui/`. La source monnaie
remise par le propriétaire contient un S, mais son SHA diffère de celui de
l'asset points runtime; la filiation n'est pas établie. Le ticket est rendu seul
et le composant `SkkupIcon` n'ajoute pas de monogramme en superposition. Le KPI de série utilise `flame`;
l'ancienne illustration de série a été retirée. Les écrans chargent les icônes
via `SkkupIcon` et `/assets/*`.

La monnaie remise par le propriétaire pour l'usage points est recensée dans
[`docs/design/media-inventory.md`](../docs/design/media-inventory.md). Son SHA
diffère de celui du PNG runtime `icons/ui/points.png`; aucune transformation,
filiation ou licence de tiers n'est déduite de cette différence.
