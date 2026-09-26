# Référencement naturel

## Périmètre livré

- Les routes publiques déclarent un titre, une description et un canonical
  absolu via `metadataBase`.
- L'accueil expose les données structurées vérifiables `Organization` et
  `WebSite`. La FAQ expose un `FAQPage` correspondant aux questions affichées.
- `frontend/src/app/robots.ts` autorise les pages publiques, exclut les zones
  privées et référence le sitemap.
- `frontend/src/app/sitemap.ts` ne liste que les routes publiques existantes.
- Les espaces d'authentification, dashboard et administration sont `noindex`.
- Le chargement initial n'attend pas Google Fonts : la pile système réduit une
  dépendance réseau et rend le build reproductible hors connexion.

## Limites et validations externes

Le sélecteur FR/EN est actuellement runtime et ne produit pas deux espaces URL
distincts. Il n'est donc pas possible de déclarer honnêtement des alternates
`hreflang` ou des URLs `/en` avant une évolution de routage.

Les signaux réels de Core Web Vitals, l'exploration par Google, la validation
Search Console, les éventuelles actions manuelles et la qualité des résultats
de recherche nécessitent un accès externe au domaine et ne sont pas prouvés par
les tests locaux. Aucune clôture SEO ne doit se fonder sur une simple génération
de sitemap ou sur un build vert.

## Vérifications reproductibles

Depuis `frontend/` :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Le contrôle de livraison du dépôt doit également être exécuté avant tout push :

```bash
bash .codex/scripts/verify-before-push.sh
```
