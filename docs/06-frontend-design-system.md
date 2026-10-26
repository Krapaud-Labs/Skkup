# 06. Design system : thème gamer néon

Basé sur les références fournies par le client (SKUP en priorité, Freecash pour certains patterns d'interface uniquement).

## Palette

**Consigne explicite du client : ne pas aller plus sombre que les deux
maquettes de référence (SKUP, Freecash).** Le fond reste une base violette
lisible, sans devenir un noir pur.

- Fond principal : mauve profond éclairci, dominante violette (proche
  `#1B1238` à `#6B3FA0`) afin de répondre à la demande de lisibilité du
  client, sans texte clair sur une surface insuffisamment contrastée.
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
- Les formulaires affichent les contraintes de mot de passe en temps réel :
  12 caractères, majuscule, minuscule, chiffre et symbole.
- Responsive mobile-first : les captures de référence sont au format mobile, la version desktop devra adapter la mise en page (grilles multi-colonnes) sans perdre l'identité visuelle.

## À faire par l'agent frontend

- Décliner cette base en tokens de design (couleurs, espacements, rayons, ombres) dans Tailwind (fichier de configuration de thème).
- Produire une bibliothèque de composants (cartes, boutons, badges, barres de progression de série) avant l'intégration des pages.
- Si le client fournit des polices ou une charte graphique complémentaire, mettre à jour ce document en conséquence avant l'implémentation.
- Vérifier visuellement que le fond réalisé ne paraît pas plus sombre que
  les captures de référence transmises par le client avant validation.
# Back-office administrateur

Les espaces Viewer et Administration partagent le cadre
`DashboardFrame` (`frontend/src/components/dashboard/DashboardFrame.tsx`), les
tokens de surface, les cartes, les bordures et le traitement visuel de la
navigation. Le dashboard Viewer est la référence pour ces éléments communs.
L'Administration conserve ses routes, libellés, permissions, densité de
données, actions et états métier propres; seuls les composants de présentation
qu'ils partagent suivent la même base visuelle. Les règles responsive du cadre
ciblent la classe réelle du rail de navigation.

Les vues d’accueil partagent la composition de leur surface d’introduction:
hero, hiérarchie du titre et du sous-titre, marque Skkup et groupe d’indicateurs
dans un même panneau violet profond. Le titre Admin reprend l’échelle fluide
du Viewer. Les quatre KPI Admin restent des liens vers leurs outils et gardent
leurs valeurs, compteurs, jauges et destinations; leur grille et leur densité
restent adaptées aux opérations du back-office. Sur petit écran, le titre se
replie et la grille KPI garde ses breakpoints Admin.
Sur desktop, seule cette surface Admin reprend le padding horizontal du contenu
Viewer (`clamp(1.25rem, 3vw, 3.75rem)`). Sous 850 px, sa marge externe est
supprimée et le retrait du shell partagé aligne les heroes; les panneaux
opérationnels Admin restent pleine largeur.

La parité partagée comprend le fond des panneaux, la couleur et épaisseur des
bordures, les rayons, la typographie des titres, les surfaces d'icônes, les
accents de marque et les variantes de boutons. Elle utilise `--dashboard-panel`,
`--dashboard-panel-raised`, `--dashboard-line`, `--dashboard-ink`,
`--dashboard-muted` et `--dashboard-accent` issus de `globals.css`. Un KPI,
un hero ou une illustration admin ne reçoit pas de teinte cyan propre à son
ancien style. Les surfaces restent sobres, avec l'accent violet du Viewer.
Les couleurs sémantiques succès, avertissement et erreur restent propres aux
états métier. La grille et densité des tables admin, ainsi que leurs colonnes,
peuvent différer pour préserver la lecture opérationnelle. Les listes et tables
admin gardent leur défilement interne violet.

Le conteneur `.skuup-dashboard-shared-frame` possède l'unique fond et la seule
géométrie de shell: fond radial bleu nuit sur `#06142d`, track de navigation
desktop fluide `clamp(14rem, 15vw, 16rem)` (de `224px` à `256px`), borné par
`min-width: 0`, rail sticky et même padding dans les deux espaces. Le padding
extérieur du cadre est nul, comme dans le Viewer. La QA après rebuild a confirmé
les mêmes mesures sur les deux routes: à `1920×873`, rail `256px` en `x=0`, gap
`48px`, contenu `1616px` en `x=304`; à `1280px`, rail `224px` et contenu en
`x=262`. `body.scrollWidth` et `body.clientWidth` valent tous deux `1920px` à
1920px. Aux largeurs `768`, `390` et `320px`, la QA n’a observé ni débordement
ni collision et a confirmé la navigation empilée. La preuve utilise uniquement
une session d’authentification mock; l’authentification réelle n’est pas
couverte. Le contenu ne reçoit pas
de padding latéral supplémentaire sur les seules routes admin. Sous
`900px`, les deux shells replient le rail au-dessus du contenu avec une grille
de liens à deux colonnes; sous `600px`, la grille passe à une colonne. Le shell
admin réutilise directement le même track, sans règle séparée de largeur de
colonne, sans règle historique `width: auto` sur le rail et sans retrait
supplémentaire du contenu. Il ne redéfinit ni son fond ni sa largeur de colonne.

Les CTA primaires admin reprennent également le dégradé violet vers
`--color-accent-cta`, le texte foncé, la forme capsule et l'ombre au survol de
`BoutonCTA` Viewer. Ils gardent leur hauteur minimale et leur taille de texte
adaptées aux écrans admin denses. Les boutons secondaires restent distincts.

Le back-office reste accessible uniquement après vérification du
rôle `ADMIN` par l'API ; la redirection frontend n'est qu'un confort et ne
remplace jamais `AdminGuard`. Les actions sensibles affichent un état d'erreur
accessible et les listes restent utilisables au clavier.
---
last_updated: 2026-09-25
---
