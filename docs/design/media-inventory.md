---
last_updated: 2026-10-30
owner: Mickael MUR
---

# Inventaire des médias

Dernière mise à jour : 2026-10-30.

## Périmètre et niveau de preuve

Le relevé initial du 2026-10-21 énumérait 141 chemins média suivis par Git. Les catégories et usages ci-dessous sont déduits des chemins et des descriptions textuelles présentes dans le dossier. Les captures sous `docs/` sont des pièces documentaires/visuelles, pas une preuve de licence des médias du produit. Les 23 anciens SVG d’interface et de gabarit sous `asset/icons/legacy/` ont depuis été retirés après vérification qu’aucune source runtime ne les charge; les lignes correspondantes ont été supprimées de cet inventaire.

Pour **chaque chemin** listé ci-dessous, sauf déclaration de catégorie IA explicitement indiquée, les valeurs individuelles suivantes sont **non établies / à confirmer** : provenance précise (auteur/source/version), brief ou prompt, source éditable, retouches et droits/licence. Une indication d'origine IA héritée de MEDIA-001 à MEDIA-004 n'établit ni le prompt, ni le fichier source, ni les conditions de droits de chaque ressource. L'audit technique du 2026-10-28 a examiné les signatures, dimensions, tailles et empreintes SHA-256 des 70 médias sous `asset/`; il ne constitue pas une inspection visuelle pixel par pixel ni une preuve de provenance ou de droits.

La source de monnaie fournie par le propriétaire est disponible sous `/Users/krapaud/Downloads/Monnaie_fond_transparent.png`; son SHA-256 recalculé est `24a670d71339bb3c98216fc55b4c710c65c7a33eff69b58f745470bd699e2886`. Le propriétaire a explicitement autorisé son usage pour les points. La preuve Git établit qu'avant le commit `ed845b2671457f1c83a81f5521d5d5116da3ce62` du 2026-10-26, le blob de `asset/icons/ui/points.png` était `d8d4b8476d7dc95b187bbabfe1cc6cb45bce0911`, dont le SHA-256 du fichier est identique à celui de la source. Ce commit remplace ce blob par `2300039f90ebf4392ab8fadd42b000e57624b4f9`, dont le fichier correspond à l’asset runtime actuel et a le SHA-256 `211758f72723ffe7d409574733e6259a8b63a57ddfab0c633defce029fb22f2b`. La filiation binaire historique entre la source et l’ancien asset est donc établie; la transformation, son auteur et les conditions de création du nouveau blob ne sont pas documentés. L’autorisation d’usage des points ne prouve pas les droits de tiers, une licence, un prompt, les retouches ni une revue juridique.

## Inventaire par chemin

Depuis le 2026-10-25, les médias source du produit sont regroupés dans [`asset/`](../../asset/README.md). Le frontend les sert directement depuis cette source; le paquet extension copie uniquement les ressources dont il a besoin vers `extension/dist/`. Les chemins ci-dessous désignent les sources centralisées actuelles; la section Captures et références documentaires conserve leurs emplacements sous `docs/`.

### Captures et références documentaires

| Chemin suivi | Catégorie / usage déductible |
| --- | --- |
| `docs/audits/qa-shell-login-1280.png` | Capture documentaire QA, écran de connexion à 1280 px |
| `docs/design/evidence/dashboard-admin-1280.png` | Capture de preuve design, dashboard admin, 1280 px |
| `docs/design/evidence/dashboard-admin-320.png` | Capture de preuve design, dashboard admin, 320 px |
| `docs/design/evidence/dashboard-admin-768.png` | Capture de preuve design, dashboard admin, 768 px |
| `docs/design/evidence/dashboard-viewer-1280.png` | Capture de preuve design, dashboard viewer, 1280 px |
| `docs/design/evidence/dashboard-viewer-320.png` | Capture de preuve design, dashboard viewer, 320 px |
| `docs/design/evidence/dashboard-viewer-768.png` | Capture de preuve design, dashboard viewer, 768 px |
| `docs/design/skkup-dashboard-references/admin-annonces-contenus-detaille.png` | Référence design, annonces/contenus admin |
| `docs/design/skkup-dashboard-references/admin-lots-detaille.png` | Référence design, lots admin |
| `docs/design/skkup-dashboard-references/admin-signalements-utilisateurs-detaille.png` | Référence design, signalements/utilisateurs admin |
| `docs/design/skkup-dashboard-references/admin-tirage-detaille.png` | Référence design, tirage admin |
| `docs/design/skkup-dashboard-references/dashboard-admin-principal.png` | Référence design, dashboard principal admin |
| `docs/design/skkup-dashboard-references/dashboard-viewer-principal.png` | Référence design, dashboard principal viewer |
| `docs/design/skkup-dashboard-references/ecrans-secondaires-admin.png` | Référence design, écrans secondaires admin |
| `docs/design/skkup-dashboard-references/ecrans-secondaires-viewer.png` | Référence design, écrans secondaires viewer |
| `docs/design/skkup-dashboard-references/viewer-extension-detaille.png` | Référence design, extension viewer |
| `docs/design/skkup-dashboard-references/viewer-historique-detaille.png` | Référence design, historique viewer |
| `docs/design/skkup-dashboard-references/viewer-recompenses-detaille.png` | Référence design, récompenses viewer |
| `docs/design/skkup-dashboard-references/viewer-streams-detaille.png` | Référence design, streams viewer |
| `docs/design/skkup-dashboard-references/viewer-tirages-detaille.png` | Référence design, tirages viewer |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin-desktop-1280.png` | Capture de vérification design, admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin-mobile-320.png` | Capture de vérification design, admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin-tablet-768.png` | Capture de vérification design, admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_announcements-desktop-1280.png` | Capture de vérification design, annonces admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_announcements-mobile-320.png` | Capture de vérification design, annonces admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_announcements-tablet-768.png` | Capture de vérification design, annonces admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_audit-desktop-1280.png` | Capture de vérification design, audit admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_audit-mobile-320.png` | Capture de vérification design, audit admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_audit-tablet-768.png` | Capture de vérification design, audit admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_content-desktop-1280.png` | Capture de vérification design, contenu admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_content-mobile-320.png` | Capture de vérification design, contenu admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_content-tablet-768.png` | Capture de vérification design, contenu admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_lots-desktop-1280.png` | Capture de vérification design, lots admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_lots-mobile-320.png` | Capture de vérification design, lots admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_lots-tablet-768.png` | Capture de vérification design, lots admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_moderation-desktop-1280.png` | Capture de vérification design, modération admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_moderation-mobile-320.png` | Capture de vérification design, modération admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_moderation-tablet-768.png` | Capture de vérification design, modération admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_raffles-desktop-1280.png` | Capture de vérification design, tirages admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_raffles-mobile-320.png` | Capture de vérification design, tirages admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_raffles-tablet-768.png` | Capture de vérification design, tirages admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_users-desktop-1280.png` | Capture de vérification design, utilisateurs admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_users-mobile-320.png` | Capture de vérification design, utilisateurs admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/admin_users-tablet-768.png` | Capture de vérification design, utilisateurs admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard-desktop-1280.png` | Capture de vérification design, dashboard admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard-mobile-320.png` | Capture de vérification design, dashboard admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard-tablet-768.png` | Capture de vérification design, dashboard admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_extension-desktop-1280.png` | Capture de vérification design, extension admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_extension-mobile-320.png` | Capture de vérification design, extension admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_extension-tablet-768.png` | Capture de vérification design, extension admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_historique-desktop-1280.png` | Capture de vérification design, historique admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_historique-mobile-320.png` | Capture de vérification design, historique admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_historique-tablet-768.png` | Capture de vérification design, historique admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_recompenses-desktop-1280.png` | Capture de vérification design, récompenses admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_recompenses-mobile-320.png` | Capture de vérification design, récompenses admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_recompenses-tablet-768.png` | Capture de vérification design, récompenses admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_streams-desktop-1280.png` | Capture de vérification design, streams admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_streams-mobile-320.png` | Capture de vérification design, streams admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_streams-tablet-768.png` | Capture de vérification design, streams admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_tirages-desktop-1280.png` | Capture de vérification design, tirages admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_tirages-mobile-320.png` | Capture de vérification design, tirages admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/admin/dashboard_tirages-tablet-768.png` | Capture de vérification design, tirages admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/post-3a27445/admin_lots-desktop-1280.png` | Capture historique de vérification, lots admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/post-3a27445/admin_lots-mobile-320.png` | Capture historique de vérification, lots admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/post-3a27445/admin_lots-tablet-768.png` | Capture historique de vérification, lots admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/post-8dc3f43/admin_lots-desktop-1280.png` | Capture historique de vérification, lots admin desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/post-8dc3f43/admin_lots-mobile-320.png` | Capture historique de vérification, lots admin mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/post-8dc3f43/admin_lots-tablet-768.png` | Capture historique de vérification, lots admin tablette 768 px |
| `docs/quality/evidence/dash-v3-final-captures/viewer/dashboard-desktop-1280.png` | Capture de vérification design, dashboard viewer desktop 1280 px |
| `docs/quality/evidence/dash-v3-final-captures/viewer/dashboard-mobile-320.png` | Capture de vérification design, dashboard viewer mobile 320 px |
| `docs/quality/evidence/dash-v3-final-captures/viewer/dashboard-tablet-768.png` | Capture de vérification design, dashboard viewer tablette 768 px |
| `docs/quality/evidence/p0-live-2026-10-08/admin_announcements-desktop-1280.png` | Capture de preuve QA P0, annonces admin desktop 1280 px |

### Ressources du produit et de l’extension

Source unique : [`asset/README.md`](../../asset/README.md). Seule la sortie générée `extension/dist/` contient des copies de livraison.

Cartographie statique et relevé binaire : la colonne « Référence code » indique une référence source et ne prouve pas un chargement ou un rendu. Complément local Docker du 2026-10-29 : les réponses SSR publiques référençaient trois icônes de marque; leur téléchargement a été vérifié séparément. Cette observation n’est pas un parcours navigateur authentifié et ne couvre pas les médias ajoutés après hydratation. Les autres ressources restent « Non observé individuellement ». Les colonnes SHA-256, taille, signature/dimensions et dernier commit décrivent le fichier local à ce checkout; elles ne prouvent ni sa provenance, ni ses droits, ni son usage effectif. Les noms de tests et références documentaires sont exclus des localisateurs de sources runtime.

| Chemin source | Catégorie / usage déductible | Référence code (statique) | Runtime observé | Poids (octets) | SHA-256 | Signature / dimensions | Dernier commit média |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `asset/brand/logos/skkup-wordmark-transparent.png` | Logo de marque utilisé par le site. | Aucune mention directe relevée | Non observé individuellement | 1230978 | be96ff6a4a57dc34ea4462589e6b47d683ff18e84ca8881244ec9cae340dd718 | PNG image data, 2072 x 759, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/marks/apple-icon.png` | Monogramme ou icône de navigateur. | `frontend/src/app/layout.tsx:20`; `frontend/src/app/assets/[...path]/route.ts:21` | SSR Docker local `/`, `/faq`, `/reglement`, `/dashboard` sans cookie; GET 200, SHA identique | 909599 | 0029717c16cd1b6b9941a6e67b1a51102544aa2d8e1dc038f3cc781dc0b04667 | PNG image data, 720 x 720, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/marks/favicon.ico` | Monogramme ou icône de navigateur. | `frontend/src/app/layout.tsx:16`; `frontend/src/app/assets/[...path]/route.ts:22` | SSR Docker local `/`, `/faq`, `/reglement`, `/dashboard` sans cookie; GET 200, SHA identique | 9100 | 85b8682c6180d8328c9b87c7587d7b39286b191eb2d20608aac6962f13ff7145 | MS Windows icon resource - 1 icon, 64x64 with PNG image data, 64 x 64, 8-bit/color RGBA, non-interlaced, 32 bits/pixel | c81e5331 2026-10-25 |
| `asset/brand/marks/icon.png` | Monogramme ou icône de navigateur. | `frontend/src/app/layout.tsx:17`; `frontend/src/app/layout.tsx:20` (+5 autres références source) | SSR Docker local `/`, `/faq`, `/reglement`, `/dashboard` sans cookie; GET 200, SHA identique | 909599 | 0029717c16cd1b6b9941a6e67b1a51102544aa2d8e1dc038f3cc781dc0b04667 | PNG image data, 720 x 720, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/marks/skkup-s-favicon.png` | Monogramme ou icône de navigateur. | `frontend/src/app/page.tsx:26`; `frontend/src/app/admin/page.tsx:259` (+2 autres références source) | Non observé individuellement | 909599 | 0029717c16cd1b6b9941a6e67b1a51102544aa2d8e1dc038f3cc781dc0b04667 | PNG image data, 720 x 720, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/source/skkup-extension-icon-source.png` | Source ou variante de marque conservée. | Aucune mention directe relevée | Non observé individuellement | 1577402 | 3168b558373fbe7aaca21aa6bc4d62d5dece0b1d444ed498819e1e32d5dd2b5b | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/source/skkup-extension-icon.png` | Source ou variante de marque conservée. | Aucune mention directe relevée | Non observé individuellement | 988667 | 52a6efc11d6778b5b0b7ca3c8f3f369716ec75e6048f7afd58e3798c20804edc | PNG image data, 720 x 720, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/source/skkup-s-source.png` | Source ou variante de marque conservée. | Aucune mention directe relevée | Non observé individuellement | 704833 | 1783cb329a9d971a56c507a177979bad3bb3a5196122aff40fe0f8bf0a326fd0 | PNG image data, 720 x 720, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/brand/source/skkup-wordmark-source.png` | Source ou variante de marque conservée. | Aucune mention directe relevée | Non observé individuellement | 432389 | 75e2c6b0c21aea3a7a99e7292585fe8d0a82a92e5c6135ed790183266307655d | PNG image data, 900 x 330, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/dashboard/illustrations/skkup-icon-extension-dashboard.png` | Illustration métier du dashboard. | `frontend/src/app/assets/[...path]/route.ts:25`; `frontend/src/components/ui/SkkupIcon.tsx:81` | Non observé individuellement | 1421807 | 98b65edbb21e9b59f0e9d2823b7ff850079e7006e75c2d1376f56e6865f30167 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/dashboard/illustrations/skkup-icon-reward.png` | Illustration métier du dashboard. | `frontend/src/app/assets/[...path]/route.ts:26`; `frontend/src/components/ui/SkkupIcon.tsx:80` | Non observé individuellement | 1842051 | 157bb3056baab4b6fc505401d1ad09919886e0ac57d4b0451de55e8acd9a7abd | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/dashboard/rewards/reward-art-sprite-v1.png` | Sprite visuel des récompenses du dashboard. | `frontend/src/app/globals.css:1324`; `frontend/src/app/globals.css:1328` (+2 autres références source) | Non observé individuellement | 1009705 | 881425e5732b77973ae98363c6eff5182368e5e06172f2c95c0a62058ba8685b | PNG image data, 768 x 768, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/dashboard/rewards/scratch-tier-03-foil-mask.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:33` | Non observé individuellement | 7837 | 6856cb30cd5117f3cfd33dd1fa4c4aa1a50ef6adacda47211f35d912da7b8181 | PNG image data, 1671 x 941, 8-bit/color RGBA, non-interlaced | f3d1a4e3 2026-10-28 |
| `asset/dashboard/rewards/scratch-tier-03.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:28` | Non observé individuellement | 2385639 | d3955e0c3a89f3dcbc2fd514c66011126a766376df32277ac6b047e6ce4f0c61 | PNG image data, 1671 x 941, 8-bit/color RGBA, non-interlaced | db194db9 2026-10-27 |
| `asset/dashboard/rewards/scratch-tier-07-foil-mask.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:34` | Non observé individuellement | 8087 | 923471d7716df35e095abec72ae7c942a4f15321b63b1b707abc75d1bbc6bf53 | PNG image data, 1671 x 941, 8-bit/color RGBA, non-interlaced | f3d1a4e3 2026-10-28 |
| `asset/dashboard/rewards/scratch-tier-07.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:29` | Non observé individuellement | 2756790 | 39896037458fc0405b578c3fb40879bed6b5cb3bd448ee66d261eec54a481486 | PNG image data, 1671 x 941, 8-bit/color RGBA, non-interlaced | db194db9 2026-10-27 |
| `asset/dashboard/rewards/scratch-tier-14-foil-mask.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:35` | Non observé individuellement | 7828 | 4b031ce257bccc7b6d6af1f98b5fd57ad32202762b88a52de81951452c8df5d7 | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | f3d1a4e3 2026-10-28 |
| `asset/dashboard/rewards/scratch-tier-14.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:30` | Non observé individuellement | 2542915 | 64276960aa065dd230c9bcc8210d184221201e7baf5e414799ba50716817281e | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | db194db9 2026-10-27 |
| `asset/dashboard/rewards/scratch-tier-emerald-foil-mask.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:37` | Non observé individuellement | 8035 | 0658b2f2112dc19787d3aec12bb990aa21c0b4cc6b06067e4901d9a9570290f2 | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | f3d1a4e3 2026-10-28 |
| `asset/dashboard/rewards/scratch-tier-emerald.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:32` | Non observé individuellement | 2510709 | f56e784545d2de116a3852d1debce701bb501d4e88ba53a9a95f6be0ef0cd9b2 | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | db194db9 2026-10-27 |
| `asset/dashboard/rewards/scratch-tier-platinum-foil-mask.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:36` | Non observé individuellement | 7880 | c6748e812200837d6f9516b94201cae837c23a2b1db3eea767cce1b75b753c4d | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | f3d1a4e3 2026-10-28 |
| `asset/dashboard/rewards/scratch-tier-platinum.png` | Visuel de palier de carte à gratter; l’association est déduite du nom et du chemin. | `frontend/src/app/assets/[...path]/route.ts:31` | Non observé individuellement | 2798265 | af846f7089e2f0bd576248ea126633de9a359af8b4fa47db9dbb9b59a31db320 | PNG image data, 1672 x 941, 8-bit/color RGBA, non-interlaced | db194db9 2026-10-27 |
| `asset/extension/brand/skkup-wordmark-transparent.png` | Logo incorporé au paquet de l’extension. | `frontend/src/app/assets/[...path]/route.ts:20`; `frontend/src/components/admin/AdminSectionPage.tsx:87` (+4 autres références source) | Non observé individuellement | 77517 | 0e0c331b394eb77e10213b8dfe9c71c88336097fcb01ff6a99e05f1b15c8ba37 | PNG image data, 300 x 110, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/extension/icons/package/icone-128.png` | Source ou variante d’icône du paquet de l’extension. | `extension/src/manifeste.ts:118` | Non observé individuellement | 41689 | d64b9f0e3469a156e28afd6ae37a24912c957609cb0b023b8c913f05cda887ae | PNG image data, 128 x 128, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/extension/icons/package/icone-16.png` | Source ou variante d’icône du paquet de l’extension. | `extension/src/manifeste.ts:116` | Non observé individuellement | 1002 | c8ea75e75b3036deb8260fe966650b4a77b0d532ca31db60d84722d0658aba27 | PNG image data, 16 x 16, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/extension/icons/package/icone-48.png` | Source ou variante d’icône du paquet de l’extension. | `extension/src/manifeste.ts:117` | Non observé individuellement | 6761 | b28d329790ef7592845593279bd70f1ff1e2b09ffc373fb196f14959055b0932 | PNG image data, 48 x 48, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/extension/icons/source/skkup-extension-icon.svg` | Source ou variante d’icône du paquet de l’extension. | Aucune mention directe relevée | Non observé individuellement | 719 | 65135e12873a0baf3d3cbc929403ef94bba1fd240fd00dcec0c74454b5a07b97 | SVG Scalable Vector Graphics image | c81e5331 2026-10-25 |
| `asset/extension/store/skkup-promo-large.jpg` | Visuel promotionnel de la fiche de l’extension. | Aucune mention directe relevée | Non observé individuellement | 152027 | 931dd7afb164c33546703d32df8e73cc1a4e4331d9b09e35ea1aada17e89863b | JPEG image data, baseline, precision 8, 1400x560, components 3 | c81e5331 2026-10-25 |
| `asset/extension/store/skkup-promo-small.jpg` | Visuel promotionnel de la fiche de l’extension. | Aucune mention directe relevée | Non observé individuellement | 32547 | 77e72ee0698adc21f1547802c56ecf6171a3f1b3ac445d5b5e894e6d4211c537 | JPEG image data, baseline, precision 8, 440x280, components 3 | c81e5331 2026-10-25 |
| `asset/extension/store/skuup-extension-association.jpg` | Visuel promotionnel de la fiche de l’extension. | Aucune mention directe relevée | Non observé individuellement | 23687 | 7df9ac925d17b74a0b8cb8e709db9d6bed4c27c2ba206455ef125eb4733ebb7e | JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 640x400, components 3 | c81e5331 2026-10-25 |
| `asset/extension/store/skuup-extension-suivi.jpg` | Visuel promotionnel de la fiche de l’extension. | Aucune mention directe relevée | Non observé individuellement | 19995 | c4453b437660e9b53b47286d093dcff64866545e3e350e32ad95f5539fd8ea6c | JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 640x400, components 3 | c81e5331 2026-10-25 |
| `asset/icons/ui/analytics.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:38`; `frontend/src/components/ui/SkkupIcon.tsx:47` | Non observé individuellement | 1385314 | 63a82dc68fc2f9417e82660179a17e765ef5fca857cc40851b4a3275b1676177 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/arrow-up-right.png` | Pictogramme fonctionnel PNG du lien externe. | `frontend/src/app/assets/[...path]/route.ts:66`; `frontend/src/components/ui/SkkupIcon.tsx:76` | Non observé individuellement | 1525847 | 73593c2c80215f240353b9b18cb7d2df79e49f9d66cf3fb50111a5aa49cb3a49 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/arrow.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:39`; `frontend/src/components/ui/SkkupIcon.tsx:53` | Non observé individuellement | 1186147 | 2bef14f8fbd480218f1cc9333575d16b928bea1b1cec476cc92395f329b27e09 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/audit.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:40`; `frontend/src/components/ui/SkkupIcon.tsx:52` | Non observé individuellement | 1651271 | cafe8d0e25c2e384e8e42bf6ae0869349788e3d9abc61f0a16ef540375705052 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/bell.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:41`; `frontend/src/components/ui/SkkupIcon.tsx:66` | Non observé individuellement | 1337087 | 5efcf4ba0e61c5c2a9fb3e03326c34c2895bda2be0c9b5fb1221f048e5dd51c9 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/check.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:42`; `frontend/src/components/ui/SkkupIcon.tsx:60` | Non observé individuellement | 1192749 | 7b8baaae79e3f45ed7f9b923aad5d64c7d1e9550cf5e56009c46e41ac16b5895 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/chevronDown.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:43`; `frontend/src/components/ui/SkkupIcon.tsx:64` | Non observé individuellement | 1285079 | 6c2eedb816737e8ffa02578d72c0ed1cdbec42011cb138a9eb1f43b21f09301d | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/close.png` | Pictogramme fonctionnel PNG de fermeture. | `frontend/src/app/assets/[...path]/route.ts:44`; `frontend/src/components/ui/SkkupIcon.tsx:70` | Non observé individuellement | 1474568 | d76bfb8933f04f3111e958f2e37af514069ceca97a43f3871d50f28185ffe1d8 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/draws.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:45`; `frontend/src/components/ui/SkkupIcon.tsx:49` | Non observé individuellement | 2046485 | 70f6cf9f42dc2b86f35c8fd188c45a3268254d6f45252de695b3296ba45aab24 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/extension.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:46`; `frontend/src/components/ui/SkkupIcon.tsx:50` | Non observé individuellement | 1579950 | 9a122b6f26ab85a99d58d72115aafe6af336801f567afca0494bb456476e53c0 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/eye.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:47`; `frontend/src/components/ui/SkkupIcon.tsx:61` | Non observé individuellement | 1504826 | 1d3ad1df2b65452ad5a72c25cacfeb5851a9384b5482a70bbb368cd197580ad9 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/favorite-heart-active.png` | Pictogramme fonctionnel PNG, favori actif. | `frontend/src/app/assets/[...path]/route.ts:50`; `frontend/src/components/ui/SkkupIcon.tsx:72` | Non observé individuellement | 1377488 | 9c3ab15b53a76b93deb8774c65ab318e3846796b6f094ce7cf5419e3e52916a8 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/favorite-heart.png` | Pictogramme fonctionnel PNG, favori inactif. | `frontend/src/app/assets/[...path]/route.ts:51`; `frontend/src/components/ui/SkkupIcon.tsx:71` | Non observé individuellement | 1500638 | e6d09ca66ecd8c462c012c963d63baaec18fc64a3b188c4479c73a6a72cb3d76 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/flag.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:48`; `frontend/src/components/ui/SkkupIcon.tsx:57` | Non observé individuellement | 1304362 | 892ae92f2542b6af6cf28a24fb78b06519d528a6d76ff28ef97245e7040951be | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/flame.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:49`; `frontend/src/components/ui/SkkupIcon.tsx:69` | Non observé individuellement | 1251086 | 047180ac2ca48b339f8a8f06d5ac09f665b435d2dcfc33705a30dcf21757ea10 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/gift.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/admin/page.tsx:815`; `frontend/src/app/assets/[...path]/route.ts:52` (+1 autres références source) | Non observé individuellement | 1629450 | c2b313d2d14fa0b76bdfd33d7b1115955d30dc0dde503a164bba3a451c3a26ba | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/megaphone.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:53`; `frontend/src/components/ui/SkkupIcon.tsx:56` | Non observé individuellement | 1454309 | 490bc0e8442ae22fe1dcabfcf76d524894918d0e416250c1e31455b57a0108c6 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/points.png` | Image monnaie PNG utilisée pour les points. Le propriétaire a autorisé cet usage pour la source fournie. Git établit que l’ancien blob `d8d4b847…` était identique à cette source; le commit `ed845b2` le remplace par le blob runtime `2300039f…` (SHA-256 fichier `211758f7…`). La transformation et l’auteur du nouveau blob ne sont pas documentés. L’absence de calque/composite ajouté est vérifiée dans le composant. Droits tiers, licence, prompt et retouches non établis. | `frontend/src/app/assets/[...path]/route.ts:54`; `frontend/src/components/ui/SkkupIcon.tsx:63` | Non observé individuellement | 1922100 | 211758f72723ffe7d409574733e6259a8b63a57ddfab0c633defce029fb22f2b | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | ed845b26 2026-10-26 |
| `asset/icons/ui/rules.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:55`; `frontend/src/components/ui/SkkupIcon.tsx:51` | Non observé individuellement | 1707292 | 4bab4a4ade69dd277558ff74238d90fca4efa2edca2271781d76fbc31538e29a | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/scratchCard.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:56`; `frontend/src/components/ui/SkkupIcon.tsx:67` | Non observé individuellement | 1625384 | aa176504504ca7f3e6bb6fcc61c3cf16240007977a0f180ad744115d4b6c8a44 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/shield.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:58`; `frontend/src/components/ui/SkkupIcon.tsx:59` | Non observé individuellement | 1503348 | d79044dd57f6490c025e51c302b23662fe8f7da3d16bb89dadebbfec33e37cd2 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/sparkle.png` | Pictogramme fonctionnel PNG décoratif. | `frontend/src/app/assets/[...path]/route.ts:57`; `frontend/src/components/ui/SkkupIcon.tsx:75` | Non observé individuellement | 1095320 | e1f8a577128a332dea048885fc6fe9ae5f02408a836dec8d80ea6696c536d6d8 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/status-pending.png` | Pictogramme PNG de contrainte non satisfaite. | `frontend/src/app/assets/[...path]/route.ts:60`; `frontend/src/components/ui/SkkupIcon.tsx:73` | Non observé individuellement | 1881623 | 6765274fdc604b7372eb3fe5a9de3ea4b0457e639aad7066fb33740c93793ef3 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/streams.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:59`; `frontend/src/components/ui/SkkupIcon.tsx:48` | Non observé individuellement | 1477961 | 1f4d0d63dbbe3c905608b012af7860e21ba50600eebed03197434c184b0cf2a7 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | ed845b26 2026-10-26 |
| `asset/icons/ui/ticket.png` | Ticket PNG RGBA 1254 × 1254; une seule image source est rendue, sans calque S. | `frontend/src/app/assets/[...path]/route.ts:61` | Non observé individuellement | 1494874 | 92052d43a5d813e7e43ae05ef9cf01102dcb50d692c81901982bce34361ad518 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/timer.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:62`; `frontend/src/components/ui/SkkupIcon.tsx:65` | Non observé individuellement | 1716833 | 94ed16f338068eb1b91563ed29d723e186fd55edf09f4cba2304d7e70769d185 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/trophy.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:63`; `frontend/src/components/ui/SkkupIcon.tsx:58` | Non observé individuellement | 1655727 | c63bd82168c02bc16cd5f317fa28af2e9336f3018fcffa18031b0ae6cadf9a6c | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/users.png` | Pictogramme fonctionnel PNG. | `frontend/src/app/assets/[...path]/route.ts:64`; `frontend/src/components/ui/SkkupIcon.tsx:54` | Non observé individuellement | 1509453 | 39c25993f9d2321c3a8cd9a35c2f90b4ede24f7c08aaf1154efe10e0b6cd7735 | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/icons/ui/warning.png` | Pictogramme fonctionnel PNG d’alerte. | `frontend/src/app/assets/[...path]/route.ts:65`; `frontend/src/components/ui/SkkupIcon.tsx:74` | Non observé individuellement | 1374963 | 599c0278b48f381ddb532286f9aaef714e0c74e99f3592c5e455a12263e636aa | PNG image data, 1254 x 1254, 8-bit/color RGBA, non-interlaced | 3269570d 2026-10-25 |
| `asset/marketing/hero/skkup-hero-products-v3.png` | Image principale de la vitrine. | `frontend/src/app/layout.tsx:31`; `frontend/src/app/layout.tsx:38` (+2 autres références source) | Non observé individuellement | 2096540 | 3aad95a4e51ed95cb0c2d3bf821eb9aaa45355d6a6b70d51fee847377eb05d0e | PNG image data, 1024 x 1536, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/marketing/steps/skkup-step-install.png` | Image d’une étape de la vitrine. | `frontend/src/app/assets/[...path]/route.ts:68`; `frontend/src/components/i18n/LocalizedHomeSteps.tsx:7` | Non observé individuellement | 1980260 | c335ddf813708c52051be33daf2f6995b101949b35d5887a2e89853948e443ae | PNG image data, 1586 x 992, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/marketing/steps/skkup-step-points-v2.png` | Image d’une étape de la vitrine. | `frontend/src/app/assets/[...path]/route.ts:69`; `frontend/src/components/i18n/LocalizedHomeSteps.tsx:9` | Non observé individuellement | 1786356 | d8ab66ef41bb19585157c5a7c2336b4430c70372ae0f42062a24b4075f7965ec | PNG image data, 1586 x 992, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/marketing/steps/skkup-step-reward.png` | Image d’une étape de la vitrine. | `frontend/src/app/assets/[...path]/route.ts:70`; `frontend/src/components/i18n/LocalizedHomeSteps.tsx:10` | Non observé individuellement | 2003718 | 806d4feb1d874b57851506070ab44685e0d3ddb48bc4ec887ee61fae01c00cb5 | PNG image data, 1586 x 992, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/marketing/steps/skkup-step-watch.png` | Image d’une étape de la vitrine. | `frontend/src/app/assets/[...path]/route.ts:71`; `frontend/src/components/i18n/LocalizedHomeSteps.tsx:8` | Non observé individuellement | 2117857 | 44c4f080efbb8af3119ef4aa271684effcf1ceacb5ab2a2e7fc1e5691bc0c34b | PNG image data, 1586 x 992, 8-bit/color RGB, non-interlaced | c81e5331 2026-10-25 |
| `asset/platforms/facebook.svg` | Logo de plateforme; le code distingue PNG runtime et source SVG. | Aucune mention directe relevée | Non observé individuellement | 266 | 897a996ef2ece054504fe46a46f0f2fdce3d3b26bac35c696b4ef6004e08619e | SVG Scalable Vector Graphics image | c81e5331 2026-10-25 |
| `asset/platforms/twitch.png` | Logo de plateforme; le code distingue PNG runtime et source SVG. | `frontend/src/app/assets/[...path]/route.ts:72`; `frontend/src/components/streams/PlateformeBadge.tsx:5` (+1 autres références source) | Non observé individuellement | 1746 | d77bfb3e036f4852718780fafeffdc30ed16fd293b50789d81cf7d109a28741b | PNG image data, 128 x 128, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/platforms/twitch.svg` | Logo de plateforme; le code distingue PNG runtime et source SVG. | Aucune mention directe relevée | Non observé individuellement | 249 | efd529a05f9a6bc2f4c069bc1a4cd3de26750972ee4f23721392b71d3e9a9a73 | SVG Scalable Vector Graphics image | c81e5331 2026-10-25 |
| `asset/platforms/youtube.png` | Logo de plateforme; le code distingue PNG runtime et source SVG. | `frontend/src/app/assets/[...path]/route.ts:73`; `frontend/src/components/streams/PlateformeBadge.tsx:6` (+1 autres références source) | Non observé individuellement | 2284 | d5f400eb1c511ae5925ccbe5e488d9c51055b89624ffdf712ac263cd2e45691e | PNG image data, 128 x 128, 8-bit/color RGBA, non-interlaced | c81e5331 2026-10-25 |
| `asset/platforms/youtube.svg` | Logo de plateforme; le code distingue PNG runtime et source SVG. | Aucune mention directe relevée | Non observé individuellement | 412 | 15f25d40a5f41e7da36b2f058efff736ec8ab61a639e595330d8acca753e4736 | SVG Scalable Vector Graphics image | c81e5331 2026-10-25 |

### Source propriétaire identifiée pour l’usage points

| Source remise | Autorisation d’usage consignée | SHA-256 source | Asset runtime associé | SHA-256 runtime | Transformation/filiation | Droits tiers |
| --- | --- | --- | --- | --- | --- | --- |
| `/Users/krapaud/Downloads/Monnaie_fond_transparent.png` | Oui, l’usage pour les points est autorisé par le propriétaire; cela ne conclut pas sur les droits tiers. | `24a670d71339bb3c98216fc55b4c710c65c7a33eff69b58f745470bd699e2886` | `asset/icons/ui/points.png` | `211758f72723ffe7d409574733e6259a8b63a57ddfab0c633defce029fb22f2b` | Git prouve que l’asset historique avant `ed845b2` était byte-identique à la source (`d8d4b847…`); `ed845b2` le remplace par `2300039f…`, blob du runtime actuel. Transformation/auteur du nouveau blob non documentés. | Non établis; aucune licence ou validation juridique par ressource retrouvée. |

### Résultat du relevé binaire du 2026-10-28

Les 70 médias suivis sous `asset/` représentent 78 976 880 octets : 61 PNG,
4 SVG, 4 JPEG et 1 ICO. Les empreintes, tailles, signatures/dimensions et
derniers commits par fichier figurent dans le tableau ci-dessus. Trois icônes
de marque (`apple-icon.png`, `icon.png` et `skkup-s-favicon.png`) ont des
octets identiques et partagent une empreinte SHA-256; cette identité ne prouve
pas qu'un fichier soit obsolète, donc aucun n'est supprimé sur cette base.

La recherche de sources trouve le CDN Twitch `static-cdn.jtvnw.net` dans
`frontend/src/lib/streams.ts`; les miniatures de streams peuvent aussi provenir
de `thumbnailUrl`, et les images de lots de `imageUrl` fourni par l'API. Les
URLs effectivement rendues pour ces valeurs dynamiques ne sont pas présentes
dans le dépôt. Le code établit des références statiques locales, mais aucune
observation navigateur par asset n'a été faite dans ce relevé.

## Ressources distantes MEDIA-005

Les miniatures de streams ne sont pas des chemins suivis dans Git. Le contrat de streams peut retourner des URLs de plateformes, notamment Twitch/CDN. Chaque ressource reste conditionnée à la source, à la publication et aux règles applicables de la plateforme; aucune licence générale Skkup n’est établie. Pour chaque URL effectivement utilisée, provenance précise, date de consultation, attribution, cache et droits sont à confirmer. Aucun URL de miniature n’a été collecté pour cet inventaire.

Contrôle local Docker en lecture seule du 2026-10-29 : une transaction PostgreSQL
`READ ONLY` filtrée sur les seuls identifiants synthétiques `qa_dashv3_%` et
`local_demo_%` n’a trouvé aucun stream, lot, contenu QA ou compte demo. Les
fixtures ne fournissent donc aucune URL média runtime à cartographier dans cet
environnement. Les données non synthétiques n’ont pas été interrogées. Les
routes frontend publiques vérifiées sans cookie ne prouvent pas les images des
dashboards après hydratation ou authentification.

## Déclarations et décisions conservées

- La déclaration owner datée du 2026-10-07 lie la génération IA aux catégories MEDIA-001 (logo/monogramme, dépôt local `frontend/public/` et extension), MEDIA-002 (icônes/pictogrammes `frontend/public/branding/`), MEDIA-003 (illustrations `frontend/public/images/`) et MEDIA-004 (sprite/illustration `frontend/public/assets/dashboard-v3/`). Cette déclaration est reportée uniquement pour les chemins identifiés ci-dessus comme appartenant textuellement à ces catégories; elle n’est pas étendue aux captures documentaires, ressources génériques/framework, icônes de plateformes ou visuels promotionnels dont l’association n’est pas établie.
- L’owner a autorisé les usages prévus pour MEDIA-001 à MEDIA-004. Cette autorisation ne constitue pas une preuve par fichier du brief/prompt, de la source éditable, des retouches, des conditions fournisseur ou des droits.
- La déclaration propriétaire relative au PNG identifié par le SHA `24a670d7…99e2886` est reliée à la source `Monnaie_fond_transparent.png` et à l’ancien blob Git de `asset/icons/ui/points.png`, byte-identique avant `ed845b2`. Cette filiation ne documente pas la transformation du blob actuel ni les droits de tiers.
- MEDIA-005 reste soumis aux conditions de chaque plateforme et ressource publiée.

## Chronologie probatoire du lot UI-ICON-001

- Le rapport [ImageGen du 2026-10-25 à 16:23](../../.codex/work-items/2026-10-25-ui-icon-001/reports/image-generation-pack.md)
  référence 31 fichiers PNG `exec-*` avec leurs SHA-256: 27 glyphes UI de base
  (lignes 27–53 du rapport) et quatre candidats/cadres `ticket` et `points`
  (lignes 64–67). Ces fichiers établissent l'existence d'un lot candidat, pas
  un mapping au pack runtime actuel. Par exemple, les glyphes déclarés `analytics`
  (`57152204…`) et `streams` (`99f2fd6e…`) ont leurs propres empreintes. Ces
  empreintes ne correspondent pas aux fichiers runtime des commits ci-dessous;
  le rapport ne suffit donc pas à relier individuellement les sorties aux PNG
  actuels.
- Le commit `c81e5331` (#452) ajoute le premier set de 29 PNG dérivés sous
  `asset/icons/ui/`, en 256 × 256 px. Le commit `3269570d` (#453) remplace ce
  set par les images 1254 × 1254 px du pack accepté. La différence est
  vérifiable dans Git: par exemple `analytics.png` passe de SHA-256
  `779f94ca…` à `63a82dc6…`; `streams.png` passe de `bca9551c…` à
  `064d984f…`. Ces commits prouvent l'évolution des blobs dans le dépôt, pas
  leur filiation binaire avec les sorties externes `exec-*`.
- La [grille propriétaire](ui-icon-style-owner-reference.png) est une
  référence de style. Son existence et sa copie documentaire ne prouvent pas
  qu'elle soit la source binaire des PNG actuels. Le rapport
  [d'implémentation historique](ui-icon-style-implementation.md) est marqué
  `historical-superseded`; son assertion de copie depuis
  `/private/tmp/skkup-icon-extract/` ne prouve pas que cette extraction
  corresponde au pack courant de 1254 × 1254 px.

La chaîne vérifiée s'arrête donc à l'existence du lot généré, puis aux remplacements
de blobs identifiés par commits. La filiation source `exec-*` → PNG runtime
actuel reste à établir fichier par fichier. ACT-09 demeure `needs-review`.

## Critères de complétude ACT-09

Pour chaque ressource, relier une preuve textuelle de provenance et d’usage; retrouver le brief/prompt et la source éditable lorsqu’ils existent; documenter les retouches; confirmer les droits/conditions et éventuelles obligations d’attribution. À défaut, conserver explicitement « non établis / à confirmer » et ne pas revendiquer la clôture ACT-09. Pour MEDIA-005, consigner la plateforme, l’URL source, la date de consultation et les conditions applicables avant de confirmer son usage.

## Provenance technique déclarée précédemment

Les notes documentaires antérieures mentionnent les commits `ddf198b` (icônes de navigation), `da292ea` (illustrations de récompense) et `cb945c7` (parcours vitrine), ainsi que les audits `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md` et `docs/audits/dashboard-v3-assets-motion-audit-2026-10-05.md`. Ces références n’établissent pas, à elles seules, la provenance précise, l’éditabilité ou les droits de chaque chemin listé.
