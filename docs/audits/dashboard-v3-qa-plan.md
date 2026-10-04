# DASH-V3 - stratégie QA navigateur responsive

Date : 4 octobre 2026
Rôle : QA navigateur responsive
Statut : `plan prêt, exécution non validée`

Ce document transforme l'audit de fidélité phase 1 et les spécifications viewer
et admin en contrôles reproductibles. Il ne constitue pas une validation de la
Definition of Done. Une réussite doit être établie par une exécution live,
avec cible, commit, URL, captures et résultat conservés.

## Preuve locale authentifiée du 4 octobre 2026

- Stack Docker Desktop reconstruit depuis la branche DASH-V3 ; le service
  frontend est `healthy`.
- Les routes `/dashboard`, `/dashboard/streams`, `/dashboard/tirages`,
  `/dashboard/recompenses`, `/dashboard/historique`, `/dashboard/extension`,
  `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`,
  `/admin/content`, `/admin/moderation`, `/admin/users` et `/admin/audit`
  répondent toutes HTTP 200 sur `http://localhost:3000`.
- Chrome local authentifié a vérifié `/dashboard/recompenses` : filtres
  Toutes/Disponibles/Utilisées à zéro, recherche, tri, état vide et lien vers
  l'historique sont rendus sans donnée fictive.
- Chrome local authentifié a vérifié `/admin/users` : navigation admin
  distincte, tableau contractuel, utilisateur QA réel, rôle, activité, points,
  statut et action de désactivation nommée.
- La vérification mobile authentifiée 320/768 reste ouverte : le navigateur
  intégré disponible dans cette session ne fournit pas de changement de
  viewport. La suite Playwright live reste la preuve attendue pour ce point.

## Périmètre

Les routes sont contrôlées sans interception réseau, fixture métier ni
réponse synthétique :

| Espace | Routes |
| --- | --- |
| Viewer | `/dashboard`, `/dashboard/streams`, `/dashboard/tirages`, `/dashboard/recompenses`, `/dashboard/historique`, `/dashboard/extension` |
| Admin | `/admin`, `/admin/raffles`, `/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`, `/admin/users`, `/admin/audit` |

La cible doit fournir une session QA authentifiée dans le contexte navigateur.
Une redirection vers la connexion, une réponse d'erreur ou une API inaccessible
est un échec de précondition, jamais un succès de test.

## Matrice responsive

Chaque route est exécutée à 320×844, 768×1024 et 1280×900. Les captures sont
nommées avec l'espace, la route et le viewport et sont conservées comme preuve
de la même exécution que le rapport.

| Largeur | Contrôles attendus |
| --- | --- |
| 320 | une colonne, navigation repliée ou défilable, actions tactiles visibles, aucun débordement horizontal, tableaux lisibles sans élargir le document |
| 768 | grille compacte, filtres lisibles, navigation clavier utilisable, hiérarchie des lignes conservée |
| 1280 | rail persistant, contenu contraint, composition multi-colonnes et densité proche de la référence |

## Contrôles automatisés

La suite `frontend/e2e/dashboard-v3-secondary-live.spec.ts` vérifie, pour
chaque route et largeur :

1. document HTTP inférieur à 400 et absence de redirection hors route ;
2. présence du shell DASH-V3 et d'un titre de page unique ;
3. absence de débordement horizontal du document et du body ;
4. nom accessible de chaque lien, bouton et champ rendu ;
5. présence de contrôles atteignables au clavier et focus réel ;
6. absence de liens internes cassés dans le shell (les liens externes sont
   exclus) ;
7. capture pleine page dans `test-results/dashboard-v3-live/`.

La suite ne vérifie pas la conformité pixel par pixel. Les captures doivent
être comparées aux 13 références de
`docs/design/skkup-dashboard-references/` par le spécialiste design fidelity.

Commande cible :

```bash
cd frontend
QA_BASE_URL=https://<cible-qa> npm run test:e2e -- e2e/dashboard-v3-secondary-live.spec.ts
```

Avec une cible locale, le serveur et la session doivent être préparés avant
l'exécution. Aucun `QA_BASE_URL` signifie suite ignorée et preuve absente.

## Parcours manuels obligatoires

Après la matrice automatisée, le QA ouvre chaque route dans un navigateur réel
et vérifie :

- les états chargement, vide, erreur récupérable, succès et interdit quand le
  contrat permet de les provoquer sans données fictives ;
- les CTA de navigation vers streams, tirages, récompenses, historique,
  extension, lots, annonces, contenus, modération, utilisateurs et audit ;
- les interactions protégées : participation, grattage, appariement,
  révocation, publication, suppression et exécution de tirage ;
- l'absence de données de démonstration lorsque l'API est vide ;
- le focus visible, le menu mobile, les dialogues, les labels de formulaires,
  les messages d'erreur et le respect de `prefers-reduced-motion` ;
- la composition master/detail, les médias réels ou leurs fallbacks, les
  tableaux, filtres, onglets, badges et timelines attendus par les maquettes.

Chaque interaction doit être notée avec : route, précondition, action, réponse
HTTP ou état serveur observé, résultat visuel et capture éventuelle. Une action
non testable faute de contrat ou de permission reste ouverte et est reportée,
elle n'est pas simulée.

## Critères de décision

- **P0** : redirection inattendue, fuite de données, mutation non protégée,
  route inaccessible ou débordement bloquant sur mobile. Rejet immédiat.
- **P1** : route ou CTA de la maquette absent, données fictives, état métier
  non contractuel, panneau master/detail inutilisable ou contrôle sans nom.
  Rejet de la livraison.
- **P2** : écart visuel ou accessibilité non bloquant. À corriger ou accepter
  explicitement dans le rapport, jamais à masquer.

La carte reste ouverte tant qu'un P0/P1 existe ou qu'une preuve requise manque.
La Definition of Done demande au minimum : matrice complète passante, captures
comparées écran par écran, parcours manuels réels passants, relecture après
déploiement sur `dev`, et rapport signé par des rôles distincts du développeur.

## Rapport d'exécution

Le rapport final doit inclure :

- commit testé, cible et date/heure ;
- commande exacte et résultat par route/viewport ;
- liens vers les captures et logs ;
- tableau des parcours manuels et réponses observées ;
- écarts P0/P1/P2 avec preuve, correctif et revalidation ;
- verdict `accepté` ou `refusé` motivé.

État actuel : `refusé / non exécuté`. L'audit phase 1 documente des écarts de
fidélité et la suite live existante n'apporte pas encore de preuve sur les
pages secondaires.
### Preuve responsive exécutée le 4 octobre 2026

La matrice Playwright authentifiée a été exécutée dans l'image Docker
`mcr.microsoft.com/playwright:v1.63.0-noble` contre le frontend Docker reconstruit.
Les routes `/dashboard`, `/dashboard/streams`, `/dashboard/tirages`,
`/dashboard/recompenses`, `/dashboard/historique`, `/dashboard/extension`,
`/admin`, `/admin/raffles` et `/admin/lots` répondent correctement aux largeurs
320, 768 et 1280 px. Aucun débordement horizontal n'est détecté.

Le contrôle a d'abord révélé un débordement de la sidebar du cockpit admin à 320 px.
La règle mobile a été corrigée pour le conteneur sidebar admin, puis la matrice
complète a été rejouée avec succès.

Une inspection visuelle authentifiée de `/dashboard/recompenses` a également
révélé l'absence de styles pour la toolbar, la collection et les cartes de
récompenses. Le système CSS V3 a été complété, le frontend Docker reconstruit
et le rendu contrôlé à nouveau dans Chrome.

La page `/dashboard/historique` a ensuite été inspectée dans le même parcours.
Son état vide affichait `1 / 0` ; le composant affiche désormais `0 / 0` lorsque
le contrat ne renvoie aucun mouvement. Le build Docker et la vérification Chrome
ont été rejoués avec succès.

Les écrans admin `/admin`, `/admin/raffles`, `/admin/lots` et
`/admin/announcements` ont ensuite été inspectés visuellement dans Chrome.
Les états vides et les formulaires utilisent les contrats affichés, sans
compteur inventé ; la hiérarchie latérale du cockpit a été ajustée pour séparer
correctement la marque et le libellé d’administration.

Sur `/dashboard/streams`, le parcours d’association a été exercé : le bouton
génère un code temporaire réel avec une expiration de cinq minutes et l’état
« aucun appareil associé » est rendu lorsque le contrat ne renvoie aucun
appareil.

L’inspection du dashboard viewer principal `/dashboard` a révélé une largeur
insuffisante du panneau Extension, qui cassait le texte mot par mot. La grille
V3 utilise désormais une colonne explicite pour l’icône et une colonne flexible
pour le contenu, avec une largeur minimale cohérente. Le frontend Docker a été
reconstruit et le rendu principal contrôlé à nouveau dans Chrome.

La suite live `dashboard-responsive-live.spec.ts` a été rendue authentifiée
avec `QA_BASE_URL`, `QA_EMAIL` et `QA_PASSWORD`, et vérifie désormais aussi le
nom accessible et le focus de chaque contrôle. Les 6 cas distincts
(`/dashboard` et `/admin` à 320, 768 et 1280 px) passent dans Docker avec
overflow horizontal absent ; les 6 doublons du projet Playwright mobile sont
ignorés puisque les viewports sont explicitement définis par la suite.

Les écrans admin `/admin/users`, `/admin/moderation` et `/admin/audit` ont été
inspectés dans Chrome avec la session QA. Les données affichées et les états
vides correspondent aux contrats ; la mutation « Désactiver » est visible et
nommée, mais n’a pas été déclenchée sur le compte QA afin de ne pas modifier la
session d’audit. Les filtres Audit et les liens de navigation sont présents.

La route `/dashboard/extension` a ensuite été reconstruite selon la maquette
détaillée : bénéfices pédagogiques, compatibilité navigateurs, statut réel,
parcours d’appariement en trois étapes, plateformes et confidentialité. Le
code temporaire, la liste des appareils et la révocation restent ceux du
contrat d’appariement existant. Une première capture Chrome a révélé un
débordement de grille sur les titres des bénéfices ; les colonnes ont été
explicitement alignées, le frontend a été reconstruit et la seconde capture
confirme un rendu lisible sans débordement sur le viewport desktop.

La page `/dashboard/historique` a été vérifiée après renforcement du layout
master/detail : les KPI, filtres, export, table et panneau de sélection sont
présents ; avec le compte QA sans mouvement, l'écran conserve un état vide
honnête et le compteur `0 / 0`. Le build Docker et la capture Chrome ont été
rejoués après la correction CSS.

Le cockpit `/admin` a été contrôlé dans Chrome après la passe de fidélité :
les quatre priorités restent alimentées par le résumé admin réel, les liens
ouvrent les domaines correspondants et les cartes affichent désormais un
repère d'action et une hiérarchie d'icônes plus proche de la maquette. Les
compteurs à zéro sont conservés lorsqu'aucune donnée n'est fournie par le
contrat ; aucune valeur de démonstration n'a été ajoutée.

La structure du cockpit a ensuite été rapprochée de la maquette : le journal
d'audit est maintenant un troisième panneau du groupe inférieur avec les
annonces et les signalements. Le rendu Chrome desktop confirme l'alignement
des trois panneaux ; en dessous de 1100 px, le journal passe sur toute la
largeur puis les panneaux s'empilent progressivement.

La route `/dashboard/recompenses` a été vérifiée après enrichissement de sa
composition : la collection, le solde, les filtres, la recherche, le tri, le
repère « comment ça marche » et le détail sélectionné occupent maintenant
des zones stables même lorsque l'API renvoie zéro récompense. La capture
Chrome confirme l'état vide honnête sans réduire l'écran à un simple message.

Le dashboard viewer principal `/dashboard` a été contrôlé après remplacement
du message vide stream par un panneau structuré : icône, explication et lien
vers le catalogue réel. La capture Chrome confirme que l'absence de stream ne
supprime plus la hiérarchie de la zone Temps de visionnage et qu'aucune chaîne
fictive n'est affichée.

La page `/dashboard/streams` a été contrôlée avec un catalogue contractuel
vide. L'état vide conserve désormais la sélection, la recherche, le filtre de
plateforme et un CTA vers la configuration réelle de l'extension ; la capture
Chrome confirme que le catalogue ne se réduit plus à une phrase isolée et
qu'aucun streamer de démonstration n'est injecté.

La page `/dashboard/tirages` a été contrôlée avec un catalogue vide. Elle
conserve désormais la barre de recherche, les onglets de statut avec leurs
compteurs réels, un état vide illustré et un lien vers le règlement. La
capture Chrome confirme que le parcours ne se réduit plus à une phrase et
qu'aucun lot fictif n'est affiché.

La route admin `/admin/raffles` a été contrôlée dans Chrome. Elle rend le
shell admin, les onglets de domaines et un état vide honnête, mais le compte
QA ne fournit aucun tirage ; la fiche détaillée de la maquette (lot, KPI,
règles, progression et journal) reste donc ouverte et ne doit pas être
simulée côté frontend.

Une consolidation technique a été rejouée après les dernières passes : la
suite frontend Vitest passe avec 27 fichiers et 105 tests ; la suite backend
Jest passe avec 42 suites et 285 tests. Le service backend Docker lancé ne
contient pas Jest dans son image runtime, donc la suite backend a été exécutée
dans un conteneur de validation temporaire avec les dépendances de
développement, sans modifier l'image de production.

La matrice responsive authentifiée a été rejouée après ces corrections dans
l'image Playwright Docker. Les 6 cas distincts `/dashboard` et `/admin` aux
viewports 320, 768 et 1280 px passent sans débordement horizontal ; les 6
exécutions dupliquées de l'autre projet Playwright sont ignorées comme prévu
par la suite.

Après les commits `00bd58e` et la reconstruction Docker, `/admin/announcements`
a été contrôlé dans Chrome. La composition rend maintenant un en-tête éditorial,
un CTA, une bibliothèque plus large que l'éditeur, une recherche, un filtre de
statut et trois compteurs contractuels. En état vide, la table reste honnête ;
la comparaison avec la référence confirme toutefois que la table riche, les
miniatures, les métadonnées auteur/version et les champs média restent à
implémenter lorsque les contrats les exposeront.

Après le commit `9688087`, `/admin/lots` a été recontrôlé dans Chrome. La
capture rend le shell secondaire, la table d'inventaire, la recherche, le
filtre de stock et le panneau de création dans l'état contractuel vide
(`0 / 0`), sans donnée fictive. Le panneau est également réutilisé pour
l'édition réelle via `PATCH`, mais cette mutation reste à rejouer avec une
fixture admin autorisée avant de considérer la maquette comme validée.
