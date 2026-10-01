# Préparation de publication de l’extension Chrome

## Périmètre

Préparation technique de la publication de l’extension Skkup sur le Chrome Web Store. Le paquet cible Chrome Manifest V3 et utilise uniquement l’API de production.

## Preuves reproductibles

- Build exécuté depuis `extension/` avec `SKKUP_API_URL=https://api.skkup.fr`.
- Manifest V3 généré en version `0.1.0`.
- Permission d’hôte limitée à `https://api.skkup.fr/*`.
- Permissions Chrome limitées à `storage` et `alarms`.
- Scripts de contenu limités à Twitch, YouTube et Facebook Live.
- ZIP généré localement sous `extension/Skkup-extension-v0.1.0.zip`.
- ZIP contrôlé avec 12 fichiers, sans `.env`, secret, `node_modules` ou source TypeScript.
- Lint, typecheck, 10 fichiers de tests et 59 tests extension réussis.
- Build de l’extension réussi.
- Icônes et captures de présentation présentes dans `extension/store-assets/`.
- Politique de confidentialité publique préparée à `https://skkup.fr/confidentialite`.
- Procédure de mise à jour documentée dans `extension/README.md`.

## Contrôles externes restant ouverts

- La soumission effective du ZIP dans le compte Chrome Web Store n’est pas prouvée.
- La revue Google n’est pas prouvée.
- L’installation depuis la fiche publiée n’est pas prouvée.

Ces trois éléments dépendent de l’interface du compte éditeur et ne sont pas simulés par la CI ou par un build local.

## Conclusion

La préparation technique est complète. La carte ne peut être déplacée dans « Terminé » qu’après soumission réelle et installation vérifiée depuis le Chrome Web Store.
