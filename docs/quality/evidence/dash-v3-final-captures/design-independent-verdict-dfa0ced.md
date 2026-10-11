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
