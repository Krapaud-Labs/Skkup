# Audit QA/release indépendant DASH-V3

Date : 3 octobre 2026
Branche auditée : `feat/dashboard-v3-secondary-streams`
Commit observé : `37e005f` (`fix(admin): remove hardcoded session context`)
Références : `dashboard-v3-design-fidelity-report-2026-10-03.md` et `dashboard-v3-gap-audit-2026-10-03.md`

## Verdict release

**Non approuvé.** La branche contient des corrections et des tests verts, mais la Definition of Done DASH-V3 n'est pas démontrée. La validation navigateur live est négative pour la version observée : `https://skkup.fr/dashboard` affiche encore un rendu avec des éléments que la branche corrige (`Connectée`, catalogue statique `Twitch YouTube Facebook Live`, annonce `Test`). Il n'est donc pas possible d'attribuer ce rendu à la branche courante ni de déclarer le déploiement `dev` validé.

La branche reste également non livrable en l'état pour une release stricte : le lint frontend échoue sur le fichier déjà modifié `frontend/src/components/streams/ListeStreams.tsx`. Ce fichier n'a pas été modifié par cet audit.

## Intégrité de l'audit

- Audit en lecture seule du produit : aucun fichier produit n'a été modifié.
- Seul ce rapport a été créé dans `docs/audits/`.
- Le worktree était déjà sale et contient au contrôle final `M frontend/src/components/dashboard/CentreRecompenses.tsx`, `M frontend/src/components/raffles/ListeTirages.tsx` et `M frontend/src/components/streams/ListeStreams.tsx`. Ces trois fichiers n'ont pas été modifiés par cet audit.
- Aucun commit, push, merge ou changement Trello n'a été effectué.

## Contrôles exécutés

| Contrôle | Résultat | Preuve |
|---|---|---|
| Typecheck frontend | OK | `npm run typecheck` dans `frontend` |
| Tests frontend | OK | 26 fichiers, 97 tests passés |
| Lint frontend | ÉCHEC | 2 erreurs `react-hooks/set-state-in-effect` ligne 31 et 38 de `ListeStreams.tsx`; 2 avertissements de dépendances hooks dans `AdminSectionPage.tsx` |
| Typecheck backend | OK | `npm run typecheck --if-present` dans `backend` |
| Tests backend | OK avec bind local autorisé | 42 suites, 285 tests passés |
| Tests backend sans élévation | Non concluant | échec environnemental `listen EPERM 0.0.0.0`, confirmé corrigé avec l'exécution autorisée |
| E2E complet frontend | NON EXÉCUTÉ | Playwright ne peut pas démarrer `127.0.0.1:3000` : `listen EPERM` |
| Matrice responsive live | NON EXÉCUTÉE | même impossibilité de démarrer le serveur; la spec exige en plus `QA_BASE_URL` et une session réelle |
| Vérification navigateur live | ÉCHEC de conformité observée | Chrome, URL `https://skkup.fr/dashboard`, état AX relevé le 03/10/2026 |
| Routes statiques | Présentes | 8 routes viewer dashboard et 7 routes admin inspectées sous `frontend/src/app` |
| Liens internes statiques | Aucun lien orphelin détecté | scan des `href`, `router.push` et `router.replace` contre les pages `app/**/page.tsx`; contrôle limité au routage statique |
| Données codées en dur | Risques confirmés en live, non confirmés dans la branche courante | détails ci-dessous |

## Routes couvertes et écarts prioritaires

### Viewer

Routes présentes : `/dashboard`, `/dashboard/streams`, `/dashboard/recompenses`, `/dashboard/tirages`, `/dashboard/historique`, `/dashboard/extension`, `/dashboard/compte`, `/dashboard/reglement`.

- `/dashboard` : le code courant charge le catalogue via `listerStreams()` et expose des états de chargement, vide et erreur. Toutefois, le navigateur live affiche encore `Découvre les streams disponibles`, `Twitch YouTube Facebook Live`, `Annonces > Test` et aucune donnée dynamique correspondante. P0 : publier cette version et refaire une comparaison visuelle écran par écran.
- `/dashboard/streams` : recherche, filtre, favoris et pagination existent dans `ListeStreams.tsx`. Le lint échoue sur ce composant aux lignes 31 et 38. P1 : corriger la conception des effets et exécuter les parcours réels.
- `/dashboard/recompenses`, `/dashboard/tirages`, `/dashboard/historique`, `/dashboard/extension` : routes et composants présents, mais aucune validation navigateur authentifiée ni preuve de chaque état de maquette. P1 selon le rapport de fidélité.

### Admin

Routes présentes : `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`, `/admin/users`, `/admin/audit`.

- `/admin` consomme maintenant `recupererResumeDashboardAdmin()` et rend des états de chargement/erreur. Cela répond partiellement au gap historique « summary non consommé ».
- La fidélité visuelle et la densité de la maquette admin ne sont pas prouvées en navigateur. Aucun écran secondaire admin n'a été exercé avec une session et des données non fictives.
- `AdminSectionPage.tsx` conserve deux avertissements de dépendances hooks. Ils ne bloquent pas le typecheck, mais bloquent le lint strict.
- Les badges et libellés admin doivent rester adossés aux contrats réels. La branche contient désormais `Contrat admin` et `Résumé chargé depuis les contrats`, ce qui évite certaines affirmations non prouvées, mais cela ne constitue pas une preuve de données de production.

## Données codées en dur et données fictives

### Preuves positives dans la branche

- `frontend/src/app/admin/page.tsx:28-29` annonce explicitement `Environnement non renseigné`, `Identité non fournie par le contrat dashboard` et `Résumé chargé depuis les contrats`; aucune identité ou santé de service n'est présentée comme vérifiée.
- `frontend/src/app/admin/page.tsx:35` utilise les compteurs du résumé et le libellé neutre `Contrat admin`, sans prétendre à un état de stock détaillé.
- `frontend/src/components/dashboard/TableauDeBord.tsx` consomme les streams retournés par l'API et prévoit loading/vide/erreur.

### Preuves négatives dans le live

Le snapshot d'accessibilité du navigateur sur `https://skkup.fr/dashboard` contient :

- `link ... Connectée` pour l'extension, alors que la branche courante doit afficher un état non vérifié/neutre ;
- `Découvre les streams disponibles` et le texte statique `Twitch YouTube Facebook Live` ;
- une annonce `Test` ;
- des données de session affichées (`Krapaud`, `15`, `1 j`) qui ne peuvent pas être rattachées au commit courant sans preuve de version.

Ces éléments prouvent un décalage entre le live et la branche, pas que le code courant les produit encore. Ils interdisent toute déclaration de validation du live.

## Liens et routes mortes

Le scan statique des cibles littérales dans `frontend/src` ne signale aucune cible interne qui ne corresponde pas à une page sous `frontend/src/app`. Ce contrôle ne couvre pas :

- les URLs générées à partir de données API ;
- les liens externes de plateformes ;
- les redirections auth/session ;
- les actions POST/PUT/DELETE derrière les boutons ;
- les erreurs runtime d'une route réellement ouverte.

Conclusion : **aucun lien mort statique prouvé**, mais l'absence de lien orphelin ne vaut pas validation fonctionnelle des CTA.

## Possibilité de validation navigateur

La validation navigateur est techniquement possible sur un Chrome connecté via l'outil de contrôle. Elle n'est pas reproductible localement dans cet audit :

1. le navigateur a bien ouvert `https://skkup.fr/dashboard` et fourni un arbre d'accessibilité exploitable ;
2. l'URL répond et rend un dashboard ;
3. la version rendue est manifestement antérieure ou différente de la branche (`Connectée`, streams statiques, annonce `Test`) ;
4. les E2E locaux ne peuvent pas lancer leur serveur à cause de `listen EPERM` dans le sandbox ;
5. `frontend/e2e/dashboard-responsive-live.spec.ts` est correctement configurée pour exiger `QA_BASE_URL`, une vraie session et les largeurs 320/768/1280, mais elle n'a pas produit de preuve dans cet environnement.

Il manque donc un environnement QA/deploy explicitement relié au commit, ou un déploiement `dev` terminé, avant toute comparaison finale.

## Écarts priorisés et critères de sortie

### P0

1. Déployer la branche ou fusionner proprement vers `dev`, puis prouver l'URL, le commit servi et la version runtime.
2. Refaire `/dashboard` et `/admin` à 1280, 768 et 320 avec données réelles ou états vides explicitement contractuels, puis comparer aux maquettes principales.
3. Prouver les parcours sensibles viewer/admin : extension, récompense, participation à un tirage, traitement d'un signalement, permissions et audit.
4. Vérifier que le rendu live ne contient plus les éléments anciens ou fictifs observés (`Connectée`, streams statiques, annonce `Test`).

### P1

1. Corriger les deux erreurs de lint dans `ListeStreams.tsx` et les deux avertissements de dépendances dans `AdminSectionPage.tsx`.
2. Exercer toutes les routes secondaires et leurs CTA avec loading, vide, erreur, succès, permission refusée et session expirée.
3. Comparer assets, icônes, densité, navigation et responsive de chaque écran secondaire aux 10 références secondaires.
4. Ajouter les preuves de données API non fictives et de traçabilité pour les mutations admin.

### P2

1. Ajouter au rapport final les captures et résultats de la matrice responsive live.
2. Relancer le lint et les E2E après correction, puis exécuter le script de vérification avant push.
3. Ne créer la PR et ne clôturer la carte qu'après disparition des P0/P1 et relecture indépendante.

## Décision finale

**Release refusée et Definition of Done non validée.** Les tests unitaires et les routes statiques sont encourageants, mais ils ne prouvent ni la conformité visuelle aux maquettes ni la version réellement servie par le live. La prochaine validation doit être effectuée sur un environnement relié au commit livré, avec preuves navigateur desktop/mobile et parcours fonctionnels réels.

## Addendum de revalidation Docker et navigateur local - 4 octobre 2026

La branche a ensuite été revalidée dans Docker Desktop, sans modifier le verdict de conformité visuelle global :

- PostgreSQL, Redis, backend, worker, frontend et proxy sont healthy dans la stack Compose.
- L'image frontend de production a été reconstruite depuis la branche et redémarrée avec succès.
- Les routes locales `/dashboard` et `/admin` répondent HTTP 200.
- Dans un conteneur Node dédié aux dépendances de développement : 26 fichiers de test et 102 tests passent, puis typecheck, ESLint et build Webpack passent.
- Le navigateur local authentifié affiche bien les contrats réels et les états vides honnêtes pour le viewer et l'admin, sans réintroduire les données fictives du live public.
- Le live public reste une version antérieure et ne constitue toujours pas la preuve de la branche.

La validation mobile et la comparaison visuelle écran par écran restent ouvertes. Le verdict demeure **non approuvé** jusqu'à production de ces preuves et disparition des écarts P0/P1.

### Parcours secondaires authentifiés vérifiés dans Chrome local

Avec le compte QA local et la stack Docker reconstruite depuis la branche :

- `/dashboard/streams` : catalogue vide contractuel, CTA d'installation, génération de code d'appariement et liste des appareils associés visibles.
- `/dashboard/recompenses` : filtres Toutes, Disponibles et Utilisées, solde réel à zéro et sélection de récompense sans contenu inventé.
- `/dashboard/tirages` : écran de résultats transparent avec état « aucun tirage programmé » fourni par le contrat.
- `/dashboard/extension` : parcours d'association, durée de validité du code, limite d'appareils et état vide vérifiés.
- `/admin/moderation` : dossiers chargés depuis le contrat, état vide honnête et navigation admin secondaire vérifiés.
- `/admin/users` : utilisateur QA réel affiché avec rôle, activité, points, statut et action de gestion.

Ces observations couvrent le comportement desktop local authentifié. Elles ne remplacent pas encore la preuve mobile ni la comparaison visuelle annotée avec les maquettes.
