# QA responsive/accessibilité DASH-V3

Date : 3 octobre 2026  
Périmètre : routes réelles `/dashboard` et `/admin`, largeurs 320, 768 et 1280 px.

## Contrôle ajouté

Le test dédié `frontend/e2e/dashboard-responsive-live.spec.ts` vérifie, sans interception d'API ni données synthétiques :

- le statut HTTP et l'absence de redirection hors de la route demandée ;
- la présence du shell DASH-V3 ;
- l'absence de débordement horizontal ;
- le nom accessible de chaque contrôle interactif rendu ;
- l'existence et la navigabilité clavier des contrôles visibles ;
- une capture pleine page par route et par largeur.

Commande :

```bash
cd frontend
QA_BASE_URL=https://<cible-qa> npm run test:e2e -- e2e/dashboard-responsive-live.spec.ts
```

La suite ne simule ni session, ni réponse API, ni données métier. La cible doit donc fournir une session QA authentifiée dans le contexte Playwright utilisé par le projet. Sans `QA_BASE_URL`, les tests sont explicitement ignorés et ne constituent aucune preuve.

## État de la preuve

Non validé dans cette session. BrowserAct n'a pas pu démarrer à cause d'une permission d'écriture hors workspace sur son répertoire de logs. Aucune capture live ni conformité responsive ne doit être déclarée sur cette base.

Contrôles exécutés le 3 octobre 2026 :

- `npm run test:e2e:responsive-live -- --list` : 12 cas générés (2 routes × 3 largeurs × 2 projets Playwright) ; la suite est conditionnée par `QA_BASE_URL` et n'a donc pas simulé de résultat.
- `npm run test:e2e -- e2e/responsive-accessibility.spec.ts` : non exécuté, car le serveur Playwright n'a pas pu ouvrir `127.0.0.1:3000` (`listen EPERM`). Ce résultat est un blocage d'environnement, pas un succès QA.
- Les preuves statiques disponibles restent les audits `dashboard-v3-design-fidelity-report-2026-10-03.md` et `dashboard-v3-gap-audit-2026-10-03.md`, qui concluent à des écarts P0/P1.

Les tests existants `responsive-accessibility.spec.ts` utilisent des réponses interceptées et ne suffisent pas à prouver la conformité des données et parcours réels. Le test du prototype `dashboard-ux-002-prototype.spec.ts` ne prouve pas le rendu des routes produit.

## Écarts bloquants restants

- aucune preuve live actuelle aux trois largeurs pour `/dashboard` et `/admin` ;
- session QA authentifiée et cible déployée à fournir/configurer pour exécuter la matrice sans mocks ;
- les audits de fidélité existants signalent encore des écarts P0/P1 sur la composition viewer/admin et les pages secondaires ;
- la page de modération ne doit pas afficher de chronologie reconstruite à partir de textes génériques : seuls les événements réellement fournis par le contrat d’audit peuvent être affichés ;
- les badges de lots et l’indicateur de santé admin doivent refléter une donnée ou un statut explicitement fourni par l’API, jamais une inférence visuelle non prouvée ;
- la Definition of Done ne peut pas être validée tant que les captures et parcours réels ne sont pas produits et comparés aux maquettes.

## Preuves nécessaires avant approbation

1. Les 6 exécutions passantes avec URL, commit et cible identifiés.
2. Les 6 captures produites par la suite, comparées aux maquettes correspondantes.
3. Les parcours métier réels des CTA et états loading/vide/erreur/permission/succès.
4. Une relecture du déploiement `dev` après fusion, sur les mêmes largeurs.

Verdict actuel : **non conforme démontré / validation refusée**.
