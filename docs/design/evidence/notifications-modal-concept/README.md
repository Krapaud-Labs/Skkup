---
last_updated: 2026-10-18
owner: frontend
status: prototype statique / needs-review
---

# Concept statique : annonces viewer dans Notifications

Prototype documentaire lié à [ADR-011](../../../adr-011-viewer-notifications-announcements-modal-2026-10-18.md). Il illustre le shell viewer DASH-V3, l’entrée Notifications sans badge ni point, le menu d’annonces et un modal limité au titre et au texte brut. Il ne modifie pas `frontend/`, n’appelle aucune API et n’ajoute aucune image. Le wordmark utilisé est l’asset existant `frontend/public/branding/skkup-wordmark-transparent.png`.

Les annonces, le solde et les métriques visibles sont des données fictives de démonstration, signalées dans l’interface. L’actualisation à chaque ouverture est simulée localement par un bref état de chargement; elle ne prouve pas le comportement réseau ni les règles de publication réelles.

## Prévisualisation locale

Depuis ce dossier, lancer un serveur statique :

```sh
python3 -m http.server 4173
```

Ouvrir ensuite <http://localhost:4173/>. Cliquer sur Notifications puis sur une annonce pour ouvrir le modal. Fermer avec le bouton ou `Échap`; le menu reste présent derrière le modal et le focus revient au bouton d’annonce sans actualiser ni reconstruire la liste. Le modal ne se ferme pas au clic sur le voile. La cloche, les titres d’annonces, les liens fictifs du shell et les données n’effectuent aucune navigation ni requête produit.

Tailles de revue prévues : 320 px, 768 px et 1280 px. Les classes `.skip-link`, `.nav-link`, `.retry-button` et `.text-link` déclarent des minima CSS de 44 × 44 px; leurs règles mobiles ne redéfinissent pas ces minima. Cela vérifie les déclarations de source, pas la géométrie réellement rendue. Le CSS inclut une indication de focus visible, un lien d’évitement et `prefers-reduced-motion`. Le dialogue est nommé par le titre, ne contient que le titre et le texte brut, rend le shell `inert`, ne se ferme pas au clic sur le voile, se ferme via le bouton ou `Échap`, piège `Tab` et `Maj+Tab`. Le menu et le bouton d’annonce restent montés dans le DOM mais sont masqués visuellement sous le voile pendant le modal; la liste n’est pas rechargée à la fermeture et le focus revient à son déclencheur.

Les boutons de démonstration en bas du menu permettent d’afficher les états `Liste`, `Vide`, `Erreur` (avec reprise) et `Session` (permission/session indisponible, sans contenu protégé). Ils sont des scénarios statiques locaux et ne représentent pas des réponses réelles d’API. Le chargement simulé intervient à chaque ouverture et lors d’une reprise.

Ce prototype ne remplace pas une vérification avec lecteur d’écran, une revue indépendante ou des preuves visuelles.

## Provenance et limites

- Palette, rayons et effets : tokens DASH-V3 de `frontend/src/app/globals.css`.
- Structure du shell : `DashboardSas`, `NavigationDashboard` et `TopbarDashboard`.
- Comportement attendu : décisions viewer/modal d’ADR-011.
- Référence d’apparence : `docs/design/skkup-dashboard-references/dashboard-viewer-principal.png` et les captures viewer existantes dans `docs/design/evidence/`.
- Pas de média inventé ou distant; l’illustration abstraite du shell est du CSS/texte, pas un asset produit.
- `docs/design/design-readiness.md` reste en revue. Aucun statut d’approbation, test produit ou validation d’API n’est impliqué.
