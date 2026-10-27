# QA du cadre Dashboard Viewer et Admin

agent_role: qa
agent_id: /root/qa_password_menu
status: accepted
scope: Revalidation DOM read-only du shell, de la navigation, du contenu, du CTA admin et des débordements après clamp commun, aux viewports 1920, 1280, 768, 390 et 320 px sur /dashboard et /admin.
evidence: Chromium Playwright headless local contre le frontend Docker http://localhost:3000 après rebuild healthy, réponses API de démonstration interceptées en mémoire; mesures des deux routes consignées ci-dessous. Coordinateur: observation Chrome visible 1920×873 concordante.
next_action: Faire une vérification visuelle authentifiée avec le compte local réel lors d’une session QA sûre; la parité géométrique et l’absence de débordement mesurables sont confirmées aux cinq largeurs.

## Méthode et limites

- Rebuild frontend Docker healthy, Next.js et TypeScript validés, 29 routes; statut rapporté par le coordinateur. Playwright local a ouvert le frontend du conteneur sur `http://localhost:3000` après le clamp de rail commun.
- Chromium Playwright headless isolé. Aucun contrôle de Chrome natif, aucune interaction avec Meet, aucune écriture en base.
- Réponses API Viewer/Admin interceptées en mémoire afin de rendre les shells sans identifiants locaux. Les mêmes réponses de profil et de résumé ont été fournies sur tous les viewports. Le seed de démonstration présent dans le code n’était pas injecté dans la base; ses identifiants ont échoué, puis aucune donnée n’a été modifiée.
- Mesures de `getBoundingClientRect()`, styles calculés, `documentElement.clientWidth` et `scrollWidth`. Aucun test automatisé ni capture d’écran archivée.
- Une seconde session CUA n’a pas pu rattacher l’onglet Chrome existant, déjà détenu par une autre session. Le coordinateur rapporte séparément la comparaison Chrome visible à 1920 × 873. Les mesures headless ci-dessous sont indépendantes de cette observation.

## Résultats DOM

| Largeur CSS | Route | Shell | Navigation (x, y, largeur, bas) | Contenu (x, y, largeur) | `scrollWidth` | Observation |
| ---: | --- | --- | --- | --- | ---: | --- |
| 1920 | Viewer | grid 256 + 1616, gap 48, padding 0 | 0, 0, 256, 875 | 304, 0, 1616 | 1920 | Même rail et contenu qu’Admin |
| 1920 | Admin | grid 256 + 1616, gap 48, padding 0 | 0, 0, 256, 875 | 304, 1, 1616 | 1920 | CTA primaire 164 × 45 px; gradient violet vers cyan |
| 1280 | Viewer | grid 224 + 1018, gap 38.4, padding 0 | 0, 0, 224, 875 | 262, 0, 1018 | 1280 | Même rail et contenu qu’Admin |
| 1280 | Admin | grid 224 + 1018, gap 38.4, padding 0 | 0, 0, 224, 875 | 262, 1, 1018 | 1280 | CTA primaire 160 × 44 px; gradient violet vers cyan |
| 768 | Viewer | block, rail au-dessus du contenu | 0, 0, 768, 298 | 0, 298, 768 | 768 | Pas de débordement horizontal; contenu suit la navigation |
| 768 | Admin | block, rail au-dessus du contenu | 0, 0, 768, 488 | 0, 489, 768 | 768 | Pas de chevauchement; 1 px entre rail et contenu |
| 390 | Viewer | block, rail au-dessus du contenu | 0, 0, 390, 573 | 0, 573, 390 | 390 | Pas de débordement horizontal; contenu suit la navigation |
| 390 | Admin | block, rail au-dessus du contenu | 0, 0, 390, 763 | 0, 764, 390 | 390 | Pas de chevauchement; 1 px entre rail et contenu; CTA 151 × 44 px |
| 320 | Viewer | block, rail au-dessus du contenu | 0, 0, 320, 621 | 0, 621, 320 | 320 | Pas de débordement horizontal; contenu suit la navigation |
| 320 | Admin | block, rail au-dessus du contenu | 0, 0, 320, 763 | 0, 765, 320 | 320 | Pas de chevauchement; 2 px entre rail et contenu; CTA 257 × 44 px dans le viewport |

Les coordonnées sont arrondies au pixel; les valeurs non arrondies de largeur et de colonnes peuvent donc différer légèrement de leur somme affichée. Aux cinq largeurs, `scrollWidth` est égal au viewport. En dessous de 900 px, les deux rails prennent toute la largeur et se placent au-dessus du contenu sans chevauchement mesuré. Les CTA Admin restent dans la largeur visible. Le gradient violet vers cyan correspond à la variante Viewer `BoutonCTA` et à `--color-accent-cta`.

## Conclusion QA

Le clamp commun élimine la divergence de rail à 1280 px. Les deux routes partagent maintenant les mêmes colonnes, écart et origine du contenu à 1920 et 1280 px; à 768, 390 et 320 px, les rails passent au-dessus du contenu. Aucun débordement horizontal ni chevauchement nav/contenu n’a été mesuré. Les CTA utilisent le gradient Viewer violet-cyan attendu. Les calculs sont reproductibles sur le DOM avec des réponses API mockées; les données réelles, l’authentification et les états de production ne sont pas couverts par cette revue.

**next_action :** faire une vérification visuelle authentifiée à partir du compte local pendant une session QA dédiée; conserver les mesures DOM de cette passe comme preuve responsive.
