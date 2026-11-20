# Référence des médias Skkup

Les médias utilisés par le site et les sources nécessaires au paquet de
l'extension se trouvent désormais dans [`../public/assets/`](../public/assets/).
Next.js les sert directement sous `/assets/*`; le build de l'extension lit ses
icônes et son wordmark depuis `public/assets/extension/`.

Le Dockerfile de production copie l'ensemble de `frontend/public/` dans l'image.
Aucune route applicative dédiée n'est nécessaire pour servir ces fichiers.

L'inventaire canonique, les usages, les dimensions et les empreintes sont
consignés dans [l'inventaire des médias](../../docs/design/media-inventory.md).
