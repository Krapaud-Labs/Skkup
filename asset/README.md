# Ancien emplacement des médias

Les trois calques PNG du hero ont été regroupés dans la source canonique
[`frontend/assets/marketing/hero/`](../frontend/assets/marketing/hero/). Ce
dossier ne contient plus de média runtime; la route Next sert ces fichiers
depuis `frontend/assets/` et conserve leurs URL `/assets/*`.

Les autres médias suivis sont principalement sous [`frontend/assets/`](../frontend/assets/README.md).
Le build extension copie ses ressources déclarées depuis cette source vers
`extension/dist/`; cette sortie est générée et ne doit pas être modifiée.

Le [crosswalk canonique des médias](../docs/design/media-inventory.md) distingue
les références de code, les exécutions réellement observées et les inconnues de
brief, source éditable, retouches et droits. Aucun statut juridique n'est déduit
du rangement ou du chargement d'un fichier.
