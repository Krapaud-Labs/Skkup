# Audit qualité design admin DASH-V3

Date : 4 octobre 2026
Périmètre : `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`, `/admin/users`, `/admin/audit`
Références : `docs/design/dashboard-v3-admin-spec.md`, les maquettes admin V3 et le rendu local Docker observé dans Chrome.

## Verdict

Non conforme pour livraison. Le cockpit admin est lisible et techniquement rendu, mais la fidélité écran par écran aux maquettes n'est pas démontrée. Les écrans secondaires doivent encore recevoir un contrôle visuel complet et le responsive live n'est pas prouvé.

## Preuves observées

- `/admin` répond et rend le shell admin avec navigation persistante, barre de contexte, KPI, tableaux et journal.
- Les données absentes sont rendues sous forme d'états vides honnêtes, sans fixtures QA visibles.
- Les actions principales sont accessibles par liens et les titres de panneaux sont structurés.
- Le logo admin utilise désormais l'asset Skkup transparent officiel.
- Le build Docker frontend et TypeScript passent après les derniers changements.
- `/admin/raffles` a été contrôlé dans Chrome : shell, navigation active et état vide contractuel rendus sans erreur.
- `/admin/lots` a été contrôlé dans Chrome : KPI de stock, filtres, tableau et formulaire de création présents ; l'équilibre visuel reste à comparer à la maquette avec des lots réels.
- `/admin/announcements` a été contrôlé dans Chrome : bibliothèque, filtres, état vide et formulaire de création sont rendus ; le tableau vide ne permet pas encore de vérifier la densité de la maquette avec des annonces réelles.

## Écarts de design prioritaires

| Priorité | Écart | Preuve | Impact |
|---|---|---|---|
| P0 | Les écrans secondaires admin ne sont pas comparés visuellement aux maquettes correspondantes | aucune capture live complète pour les 7 routes secondaires | impossible de prouver la conformité de la carte |
| P0 | Le cockpit admin affiche une composition simplifiée lorsque les collections sont vides | `/admin` local, états « Aucun tirage » et « Aucun lot » | la hiérarchie « priorité maintenant » et les visuels opérationnels des maquettes ne sont pas représentés |
| P1 | Les KPI utilisent des icônes compactes et génériques au lieu des illustrations V3 dédiées | `frontend/src/app/admin/page.tsx`, classe `skuup-admin-kpi-icon` | perte de fidélité visuelle et de hiérarchie |
| P1 | Les tableaux desktop ne disposent pas encore d'une preuve de transformation en cartes lisibles sur mobile | CSS responsive présent, test live non exécuté | risque de rupture sur 320 et 768 px |
| P1 | Le contexte admin présente des informations neutres mais la composition reste plus dense que la maquette | barre de contexte et en-tête observés dans Chrome | lecture moins premium et moins hiérarchisée |
| P1 | Les détails tirage, lot, annonce, modération et utilisateur doivent être audités avec données contractuelles réelles | routes présentes dans `frontend/src/app/admin` mais non exercées en capture | interactions et états métier non vérifiés visuellement |
| P2 | Plusieurs titres de panneaux admin n'ont pas d'icône dédiée dans le DOM | `content-title`, `moderation-title`, `audit-title` | cohérence iconographique incomplète avec la maquette |
| P2 | Les états vides sont fonctionnels mais ne reprennent pas tous les appels à l'action attendus par la spécification | `frontend/src/app/admin/page.tsx` | parcours de reprise moins direct |
| P1 | `/admin/raffles` devient une surface très vide quand l'API ne renvoie aucun tirage | capture Chrome du 4 octobre 2026 | la page ne permet pas de comparer les cartes de tirage, préconditions et timeline à la maquette |
| P1 | `/admin/lots` donne un poids visuel disproportionné au formulaire fixe lorsque l'inventaire est vide | capture Chrome du 4 octobre 2026 | la bibliothèque d'inventaire ne conserve pas la densité et la priorité de la maquette |
| P2 | Les KPI de stock et les lots n'affichent pas d'asset média réel dans l'état vide | `/admin/lots`, contrat API vide | la règle anti-fausse-image est respectée, mais le rendu cible reste non vérifiable sans données réelles |
| P1 | `/admin/announcements` juxtapose un formulaire très haut et une bibliothèque vide | capture Chrome du 4 octobre 2026 | l'équilibre liste/détail et les actions d'édition ne sont pas vérifiables dans l'état vide |
| P2 | Les colonnes de la bibliothèque éditoriale deviennent difficiles à lire sur une largeur réduite | capture desktop, tableau à nombreuses colonnes | une preuve mobile et une carte empilée restent nécessaires |

## Contrôles à exécuter avant clôture

1. Capturer chaque route admin en 1280, 768 et 320 px avec une session admin réelle.
2. Comparer chaque capture à la maquette associée et relever les écarts de grille, densité, typographie, iconographie, boutons et états vides.
3. Vérifier les parcours de création, modification, suppression protégée, publication, modération et audit.
4. Vérifier que chaque image de lot provient de l'API et qu'une absence d'image reste un état neutre.
5. Rejouer le scénario responsive Playwright avec les variables QA et conserver les captures.
6. Ne pas ouvrir la PR finale ni fermer la carte Trello avant la levée des P0 et la preuve indépendante QA.

## État de l'audit

Audit enregistré, corrections de design à poursuivre. Aucun gate de livraison validé.
