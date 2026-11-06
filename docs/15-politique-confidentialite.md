---
last_updated: 2026-11-06
---

# Intégration de la politique de confidentialité Skkup

## Statut

La page publique est disponible à l’adresse [`/confidentialite`](https://skkup.fr/confidentialite). Elle est accessible en français et en anglais avec le sélecteur de langue de la vitrine. Le contenu effectivement rendu est défini par `frontend/src/components/legal/ConfidentialiteContent.tsx`. Aucune validation juridique externe n’est déclarée acquise. Par décision du propriétaire du 3 novembre 2026, le MVP démarrera sans revue par avocat ou juriste; une vérification du règlement pourra être envisagée si le site prend de l’ampleur. Cette décision de calendrier ne valide pas la politique.

Dernière mise à jour produit : 23 septembre 2026.

## Périmètre documenté

La politique couvre le site, le compte utilisateur, l’extension Skkup, les sessions de visionnage, les points, les tickets, les tirages, la sécurité, le support et la remise des lots. Elle décrit notamment :

- le responsable du traitement et le contact `skkup.pro@gmail.com` ;
- les catégories de données collectées, avec minimisation ;
- les finalités et bases juridiques annoncées ;
- les destinataires et principes de conservation ;
- les droits d’accès, rectification, effacement, limitation, opposition et portabilité lorsque le droit s’applique ;
- les mesures de sécurité et les limites des services tiers utilisés par l’extension.

## Références d’intégration

- La page est rendue par `frontend/src/app/confidentialite/page.tsx`.
- Ses métadonnées et son canonical sont définis dans `frontend/src/app/confidentialite/layout.tsx`.
- Le lien est présent dans l’en-tête public et le pied de page de la vitrine.
- La route `/confidentialite` est déclarée dans `frontend/src/app/sitemap.ts` et autorisée par `frontend/src/app/robots.ts`.

## Limites et validation humaine

Le contenu ne constitue pas un avis juridique. La qualification des traitements, les durées définitives, les mentions obligatoires et la cohérence avec les CGU, le règlement du jeu et les fiches de l’extension restent sans validation juridique externe. Le propriétaire a décidé de ne pas faire de revue par avocat ou juriste avant le lancement initial du MVP et envisage cette revue si le site prend de l’ampleur. Ne pas présenter la conformité ou une validation juridique comme acquise.
