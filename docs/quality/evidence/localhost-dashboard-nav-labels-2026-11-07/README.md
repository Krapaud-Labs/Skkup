# Rendu responsive local des navigations — 2026-11-07

## Méthode et portée

Capture manuelle par Chromium Playwright isolé du frontend local, depuis le worktree `dev` au HEAD `e0bdd463197f54d84531ac9017625090554fd02f`, avec le patch local non commité décrit par le work item `2026-11-07-localhost-dashboard-diff`. Les réponses API ont été simulées avec des fixtures Viewer/Admin pour afficher les composants produit. Aucune suite de tests n’a été lancée. Ce rendu n’est pas une session backend authentifiée et ne prouve ni persistance ni autorisation serveur.

L’image Docker frontend a été reconstruite depuis ce worktree, digest `sha256:969ffc1a8df73a57e8885fb6d12a4aee492030cff1c8b9748ec45959df8950b1`; le conteneur était `healthy` et `/dashboard` répondait HTTP 200. Les deux routes ont été rendues aux largeurs 320, 390, 600, 768 et 1280 CSS px.

## Résultats observés

| Rôle | 320 | 390 | 600 | 768 | 1280 |
| --- | --- | --- | --- | --- | --- |
| Viewer `/dashboard` | [capture](skkup-viewer-320.png) | [capture](skkup-viewer-390.png) | [capture](skkup-viewer-600.png) | [capture](skkup-viewer-768.png) | [capture](skkup-viewer-1280.png) |
| Admin `/admin` | [capture](skkup-admin-320.png) | [capture](skkup-admin-390.png) | [capture](skkup-admin-600.png) | [capture](skkup-admin-768.png) | [capture](skkup-admin-1280.png) |

Les dix navigations sont visibles; les mesures rapportées donnent HTTP 200, shell présent et `document.documentElement.scrollWidth === viewport`. L’auditeur indépendant accepte le sous-critère ciblé « libellés de navigation mono-mot visibles sans troncature/débordement » sur ces captures. Cette acceptation ne ferme pas ACT-08 global: zoom, clavier/focus, lecteur d’écran, contraste, reduced-motion, notifications/modal et comparaison complète aux références restent à revoir. ACT-09 médias reste ouvert globalement, sans manque spécifique introduit par ce patch qui n’ajoute aucun média.

## Fichiers et empreintes

- `skkup-viewer-320.png` — 313633 octets — SHA-256 `243cfc93b83738f9d5388cb136750eb78460478aa475b0cbd554e283fcfbde20`
- `skkup-viewer-390.png` — 337001 octets — SHA-256 `0a031830664a704e054a277590bec2d3ec2db0f70bf8262e584157abca9a4182`
- `skkup-viewer-600.png` — 420444 octets — SHA-256 `1dc8e7468c0dd840c0f3832e8f35ef754a5bfc9f2717ff4cb08d032312a88f4b`
- `skkup-viewer-768.png` — 439359 octets — SHA-256 `5820e9ffbb02e5e21f01053ad900b09752e0c442309280cfb4a2f6c685df8ab4`
- `skkup-viewer-1280.png` — 489099 octets — SHA-256 `dc9b677c392adefa8e99b9b284a1f0d0610cd3c89941eba19acd1bb740c8dc2e`
- `skkup-admin-320.png` — 495853 octets — SHA-256 `0058d9b0d750899c8a88d0adadd7ede9995317a4301194de3f4f4177282336c9`
- `skkup-admin-390.png` — 545577 octets — SHA-256 `91e3a7aeab71b6c4aced0f1a3854446bf0d72279d4ad1987642b583dae603acf`
- `skkup-admin-600.png` — 708719 octets — SHA-256 `d0192e67d9d342e01f0b6c57ef3689103b46b5994a595c3c17139a270db62106`
- `skkup-admin-768.png` — 762725 octets — SHA-256 `47e1984a55342eba308b2f06da9fe57853816a6c3346eaa7a8a52da6b4ae5bc4`
- `skkup-admin-1280.png` — 694380 octets — SHA-256 `0d04fd50d8a4d5083c9f3494cee3bea8bea104de8a1d08361cce8860e16e7d58`
