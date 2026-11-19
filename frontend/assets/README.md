# Assets Skkup

Ce dossier contient 75 sources suivies pour le site et l'extension. Le frontend
sert les chemins autorisés sous `/assets/*` depuis `frontend/assets/`. Le paquet de l'extension copie ses seules icônes et
son wordmark vers `extension/dist/` au build.

## Où trouver les fichiers

| Dossier | Contenu |
| --- | --- |
| `brand/logos/` | Wordmarks utilisés par le site |
| `brand/marks/` | S Skkup, favicon et icônes de navigateur |
| `brand/source/` | Fichiers source et variantes conservées de la marque |
| `icons/ui/` | 30 PNG utilisés dans les écrans; le S est intégré à l'image source de points, sans calque superposé |
| `dashboard/illustrations/` | Illustration métier d’extension; l’ancienne illustration de récompense a été retirée du runtime le 2026-11-03 |
| `dashboard/rewards/` | Sprite des récompenses du dashboard |
| `platforms/` | Logos PNG runtime Twitch, YouTube et Kick; sources SVG Twitch et YouTube |
| `marketing/hero/`, `marketing/steps/` | Images de la vitrine |
| `extension/brand/`, `extension/icons/` | Images et icônes incorporées au paquet extension |
| `extension/store/` | Visuels promotionnels de la fiche extension |

Les visuels de la fiche Chrome Web Store présentent Twitch, YouTube et Kick.
Les aperçus de suivi utilisent le nom « Compte de démonstration » et des valeurs
fictives; aucun code actif ni compte réel n'y apparaît.

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
Cet inventaire sépare les call sites statiques des observations d'exécution et
consigne les briefs, sources éditables et droits comme inconnus quand aucune
preuve par ressource n'est disponible.

Le pack UI contient 30 pictogrammes PNG. Vingt-huit entrées utilisent les
sources fournies par le propriétaire: 15 images du premier lot (dont la pièce
`points` et l’ajout `free`) et 13 correspondances du lot du 2026-11-19. Une
image de check redondante du second lot n’est pas installée. `gift.png` et
`chevronDown.png` restent issus du pack historique faute de source fournie
correspondante. Les sources installées sont conservées sans recoloration ni
recadrage; leurs dimensions, alpha et empreintes sont inscrits dans
`docs/design/media-inventory.md`.

Le ticket et la pièce points sont des PNG 3D dans `icons/ui/`; le S est intégré
à l'image points, tandis que le ticket est rendu seul. Le composant `SkkupIcon`
n'ajoute pas de monogramme en superposition. Les écrans chargent les icônes via
`SkkupIcon` et `/assets/*`.

Les logos de marque/plateformes et les illustrations séparées restent distincts. Exception de
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
