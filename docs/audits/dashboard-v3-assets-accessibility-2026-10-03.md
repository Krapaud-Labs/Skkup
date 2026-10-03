# Audit assets, icônes et accessibilité DASH-V3

Date : 2026-10-03  
Périmètre : `docs/design/skkup-dashboard-references` et `frontend/public/branding`  
Contraintes : aucun composant principal modifié dans ce lot.

## Résultat

Les maquettes de référence sont présentes et les sources branding locales sont
fiables. Aucun placeholder textuel (`placeholder`, `TODO`, image de test) n’a
été trouvé dans les répertoires audités. Les SVG V3 sont vectoriels, sans
ressource externe ni script embarqué.

L’écart principal est l’intégration : le registre `SkkupIcon` utilise les SVG
de `branding/icons` pour une partie des icônes, mais plusieurs icônes dédiées
présentes dans `branding/v3` ne sont pas encore exposées par ce registre.
Le raccordement doit rester un lot dédié afin de ne pas mélanger le travail
assets avec la reconstruction des écrans.

## Inventaire des sources

### Icônes actuellement raccordées par le registre viewer/admin

| Nom fonctionnel | Source | Usage attendu | Accessibilité |
| --- | --- | --- | --- |
| overview | `/branding/icons/overview.svg` | Vue d’ensemble | décorative lorsqu’un libellé voisin existe |
| streams | `/branding/icons/streams.svg` | Streams | décorative lorsqu’un libellé voisin existe |
| draws | `/branding/icons/draws.svg` | Tirages | décorative lorsqu’un libellé voisin existe |
| extension | `/branding/icons/extension.svg` | Extension | décorative lorsqu’un libellé voisin existe |
| rules | `/branding/icons/rules.svg` | Règles/contenus | décorative lorsqu’un libellé voisin existe |
| gift | `/branding/icons/gift.svg` | Lots/récompenses | décorative lorsqu’un libellé voisin existe |
| trophy | `/branding/icons/trophy.svg` | Classement/récompense | décorative lorsqu’un libellé voisin existe |
| points | `/branding/icons/points.svg` | Points | décorative lorsqu’un libellé voisin existe |
| shield | `/branding/icons/shield.svg` | Sécurité/modération | décorative lorsqu’un libellé voisin existe |
| eye | `/branding/icons/eye.svg` | Visionnage | décorative lorsqu’un libellé voisin existe |
| check | `/branding/icons/check.svg` | Validation | décorative lorsqu’un libellé voisin existe |
| admin | `/branding/icons/admin.svg` | Administration | décorative lorsqu’un libellé voisin existe |
| bell | `/branding/v3/bell.svg` | Notifications | décorative lorsqu’un libellé voisin existe |

### Sources V3 présentes mais non raccordées au registre

| Nom proposé | Source | Écran de référence | Action dédiée restante |
| --- | --- | --- | --- |
| analytics | `/branding/v3/analytics.svg` | KPI, statistiques | exposer dans le registre et remplacer les symboles génériques |
| audit | `/branding/v3/audit.svg` | Journal d’audit | exposer dans le registre et utiliser dans la navigation audit |
| content | `/branding/v3/content.svg` | Annonces/contenus | exposer dans le registre et utiliser pour contenus |
| moderation | `/branding/v3/moderation.svg` | Signalements | exposer dans le registre et utiliser pour modération |
| scratchCard | `/branding/v3/scratch-card.svg` | Récompenses/cartes à gratter | exposer dans le registre et utiliser pour cartes |
| ticket | `/branding/v3/ticket.svg` | Tirages/participation | exposer dans le registre et utiliser pour tickets |
| flame | `/branding/v3/flame.svg` | Série/streak | exposer dans le registre et utiliser pour la série |

Ces sept fichiers ne sont pas des placeholders : ils sont présents, locaux,
lisibles et cohérents avec les domaines fonctionnels des maquettes. Ils ne
doivent pas être remplacés par des emojis ou des icônes génériques.

## Contrôles accessibilité

- Les icônes rendues par `SkkupIcon` sont actuellement décoratives (`alt=""`,
  `aria-hidden="true"`). C’est correct uniquement lorsque le texte adjacent
  porte le nom accessible de l’action ou de la navigation.
- Une icône seule dans un bouton ou un lien doit recevoir un nom accessible
  sur le contrôle (`aria-label` ou texte visuellement masqué). L’icône ne doit
  pas porter seule le nom.
- Les images de marque et les images de contenu doivent conserver un `alt`
  descriptif. Les logos déjà utilisés comme liens doivent conserver leur nom
  accessible au niveau du lien.
- Les SVG audités utilisent `currentColor` ou les couleurs de la palette
  Skkup. Ils ne contiennent pas de texte intégré, donc le nom accessible doit
  venir du composant appelant.
- Aucun `fill="transparent"` ou `stroke="none"` suspect n’a été trouvé sur
  le tracé principal des sources V3. Les remplissages sans contour servent
  uniquement aux accents internes.
- Contraste à revalider au rendu : les icônes en `currentColor` héritent du
  contexte. Les usages sur fonds violet sombre doivent conserver une couleur
  d’au moins 3:1 pour les éléments graphiques significatifs et 4.5:1 pour le
  texte adjacent normal. Ce contrôle nécessite le navigateur et ne doit pas
  être déclaré validé par inspection statique seule.

## Vérifications effectuées

- Références visuelles présentes : 13 fichiers PNG listés dans le README du
  dossier de références.
- Branding présent : sources de marque, 12 SVG génériques, 8 PNG générés et
  8 SVG V3.
- Dimensions vérifiées pour les PNG : icônes générées 1254×1254, favicon et
  sources S 720×720, wordmarks 900×330.
- Aucun fichier de test, placeholder ou ressource externe détecté dans les
  sources auditées.
- Les SVG V3 ont un `viewBox` et un tracé local ; aucun script, image externe
  ou lien externe détecté.

## Limites et suite obligatoire

Ce lot ne valide pas la fidélité visuelle des écrans et ne prétend pas valider
le contraste au navigateur. Le prochain lot assets dédié doit :

1. ajouter les sept noms V3 au registre sans modifier la structure des
   dashboards ;
2. raccorder chaque nom à la navigation ou au bloc correspondant ;
3. vérifier chaque bouton icône seul avec un nom accessible ;
4. exécuter un contrôle navigateur desktop/mobile du contraste et des états
   focus ;
5. vérifier l’absence d’ancien emoji ou placeholder dans les écrans V3.

Statut : inventaire et rapport terminés ; intégration applicative différée
pour respecter le périmètre « assets/icônes/accessibilité » sans toucher aux
composants principaux.
