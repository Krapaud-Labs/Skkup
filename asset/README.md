# Médias du hero dans `asset/`

Ce dossier ne constitue plus la source centrale des médias. Il conserve trois
calques PNG du hero de la vitrine : `marketing/hero/treasure-base.png`,
`marketing/hero/hero-light-loop-upper.png` et
`marketing/hero/hero-light-trail-lower.png`. `frontend/src/app/page.tsx` les
référence via `/assets/*`; la route Next autorise ces chemins et utilise `asset/`
comme l'une de ses racines de résolution.

Les autres médias suivis sont principalement sous [`frontend/assets/`](../frontend/assets/README.md).
Le build extension copie ses ressources déclarées depuis cette source vers
`extension/dist/`; cette sortie est générée et ne doit pas être modifiée.

Le [crosswalk canonique des médias](../docs/design/media-inventory.md) distingue
les références de code, les exécutions réellement observées et les inconnues de
brief, source éditable, retouches et droits. Aucun statut juridique n'est déduit
du rangement ou du chargement d'un fichier.
