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
