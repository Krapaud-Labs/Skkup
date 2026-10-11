# Décision indépendante design DASH-V3

Date: 2026-10-11

## Périmètre relu

- 13 références présentes dans `docs/design/skkup-dashboard-references`.
- Corpus de captures desktop, tablette, mobile et post-`8dc3f43`.
- `docs/design/design-readiness.md`.
- Relecture indépendante par l'auditeur spécialisé au HEAD `dfa0ced`.

## Verdict

`NEEDS-REVIEW`.

`design-readiness.md` maintient le gate design en revue et indique que les 13
références restent `PARTIEL`. Les écarts portent sur la densité des données,
les médias limités par les fixtures et la richesse de certains panneaux, pas
uniquement sur des champs absents des contrats API.

Les limites contractuelles peuvent être acceptées uniquement par une décision
explicite de périmètre. Elles ne ferment pas à elles seules le gate design.
L'audit indépendant de conception n'est pas encore accepté.

## Conséquence livraison

La PR vers `dev` reste interdite. Cette décision est définitive pour la
campagne actuelle et ne doit pas être relancée sans modification du périmètre,
des références ou du produit.

## Correction ciblée suivante

Le 2026-10-11, la navigation viewer et admin a reçu une correction commune :
les assets générés rendus en `<img>` utilisent désormais la même taille visuelle
que les pictogrammes SVG et le marqueur SVG technique invisible est masqué. La
correction a passé le lint frontend et 13 tests ciblés. Elle réduit l'écart
concret des icônes de navigation, sans être présentée comme une clôture du gate
de fidélité aux 13 références.

Le 2026-10-11, la timeline de la route /admin/audit a également été
densifiée sans modifier le contrat : entrées segmentées, hiérarchie acteur/date,
contraste et espacement rapprochés de la référence. La correction est couverte
par 25 tests ciblés admin/CSS et reste soumise à la relecture visuelle globale
des 13 références.

La première exécution CI du commit 93a8957 a rencontré un échec transitoire
Playwright au moment de capturer deux screenshots admin, sans assertion UI en
échec. Le job responsive a été relancé seul et a ensuite réussi, avec les cinq
autres jobs conservés en succès.
