# 06. Design system : thème gamer néon

Basé sur les références fournies par le client (SKUP en priorité, Freecash pour certains patterns d'interface uniquement).

## Palette

- Fond principal : bleu nuit très sombre à noir (proche `#0B0A14` / `#0E0B1A`).
- Accent primaire : violet/mauve néon (proche `#7B2FF7` à `#A855F7`), utilisé en dégradés pour les fonds de section et les effets de glow.
- Accent secondaire (CTA) : vert ou cyan vif (proche `#22C55E` ou `#22D3EE`) pour les boutons d'action principaux, en contraste avec le violet.
- Texte principal : blanc cassé (`#F5F3FF`), texte secondaire : gris violacé clair (`#B8B0D9`).

## Typographie

- Police d'accroche : sans-serif bold, grande taille pour les titres (type Inter/Sora/Poppins en graisse 700-800), à confirmer avec un import de police précis fourni par le client si disponible.
- Police de texte courant : même famille en graisse 400-500 pour la lisibilité.

## Composants clés

- **Carte glow** : coins arrondis (16 à 24px), fond légèrement plus clair que le fond de page, bordure ou ombre portée en violet néon avec effet de lueur (box-shadow diffus), utilisée pour les cartes de statistiques et les cartes de lots.
- **Bandeau de statistiques sociales** : ligne de chiffres clés (nombre de membres, tirages réalisés, cadeaux gagnés) avec icônes, sur fond de carte glow, reprise directe du pattern SKUP.
- **Parcours en 3 étapes** : "Tu regardes / Tu accumules / Tu gagnes", présenté en 3 cartes numérotées alignées horizontalement (empilées en mobile).
- **Carte lot** : image du lot, nom, valeur estimée, date du tirage, bouton d'action.
- **Boutons CTA** : fond dégradé violet vers cyan/vert ou couleur pleine cyan/vert selon la hiérarchie, coins très arrondis, effet de lueur au survol.

## Principes d'interaction

- Micro-animations de lueur (glow) au survol des cartes et boutons pour renforcer l'identité "gamer".
- Contraste texte/fond vérifié pour l'accessibilité (WCAG AA minimum) malgré le thème sombre et les couleurs vives.
- Responsive mobile-first : les captures de référence sont au format mobile, la version desktop devra adapter la mise en page (grilles multi-colonnes) sans perdre l'identité visuelle.

## À faire par l'agent frontend

- Décliner cette base en tokens de design (couleurs, espacements, rayons, ombres) dans Tailwind (fichier de configuration de thème).
- Produire une bibliothèque de composants (cartes, boutons, badges, barres de progression de série) avant l'intégration des pages.
- Si le client fournit des polices ou une charte graphique complémentaire, mettre à jour ce document en conséquence avant l'implémentation.
