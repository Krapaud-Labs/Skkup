# Audit complet du projet et tests réels navigateur

## Périmètre et état

- Carte : [Audit complet du projet et tests réels navigateur](https://trello.com/c/gPrNyuLA/76-audit-complet-du-projet-et-tests-r%C3%A9els-navigateur)
- Branche : `feature/audit-browser-76`, créée depuis `origin/dev` (`a33821f`)
- Date de l’audit : 26 septembre 2026
- Aucun changement produit de la carte internationalisation ou de la carte confidentialité n’est inclus.

## Contrôles exécutés

| Domaine | Contrôle | Résultat | Preuve ou limite |
| --- | --- | --- | --- |
| Git | état, branche, diff depuis `origin/dev` | OK avant le rapport | Le changement non commité de `frontend/src/app/confidentialite/page.tsx` est hors périmètre et a été conservé intact. |
| Backend | ESLint non mutateur, typecheck, Jest, build | OK | 34 suites, 252 tests réussis ; l’exécution a été autorisée à ouvrir un port local. |
| Extension | ESLint, typecheck, Vitest, build | OK | 9 fichiers de tests, 56 tests réussis ; build `dist/` réussi. |
| Frontend | ESLint, typecheck | ÉCHEC hors périmètre | Le fichier confidentialité non commité référence `translations.privacy`, absent du contrat de traductions. Aucune modification n’a été faite sur cette carte. |
| Frontend | tests et build | Non exécutables après l’échec du typecheck | À reprendre après intégration de la correction de la carte confidentialité. |
| Documentation | lint Markdown local | Non prouvé | `markdownlint-cli2` n’est pas installé localement et son téléchargement a été interrompu par l’environnement réseau. |
| Dépendances | `npm audit --omit=dev --audit-level=high` | Non prouvé | Le registre npm est inaccessible : résolution DNS `ENOTFOUND registry.npmjs.org`. |
| Sécurité de base | détection de secrets suivis | OK partiel | `git ls-files` ne trouve que `.env.example` et `backend/.env.example`, sans secret réel. |
| Sécurité de base | `security-baseline.sh` | Non prouvé | Le Python système ne fournit pas `tomllib` ; aucun résultat de sécurité n’est inventé. |
| CI | workflows inspectés | Conforme à la lecture statique | CI séparée pour documentation, frontend, backend, extension et Docker ; actions épinglées par SHA. Exécution distante à confirmer sur la branche publiée. |
| Navigateur réel | visiteur, utilisateur, administrateur, desktop/tablette/mobile | Non prouvé | `browser-act` et `uv` sont absents ; la liaison Chrome native a été refusée par le connecteur avant interaction. Aucune validation navigateur ou production n’est déclarée. |

## Revue sécurité ciblée

- Les fichiers d’environnement suivis sont des modèles et utilisent `change_me`.
- Les compose de production exigent `DATABASE_URL` et `JWT_SECRET` via des variables obligatoires ; aucun secret n’est inscrit dans les fichiers suivis.
- Les tests backend couvrent les refus WebSocket, le throttling et les refus d’accès administrateur dans les logs de test.
- Le scan de dépendances et le socle automatisé restent à exécuter dans un environnement disposant du registre npm et d’un Python compatible.

## Anomalies et limites restantes

1. Le typecheck frontend est bloqué par le changement non commité de la carte confidentialité. Cette anomalie doit être corrigée dans sa branche dédiée.
2. Les contrôles navigateur réels restent entièrement à réaliser avec un navigateur contrôlable et des viewports documentés.
3. Les audits npm, le lint Markdown local et le script de sécurité nécessitent un environnement outillé et réseau.
4. La carte Trello reste ouverte : la Definition of Done n’est pas prouvée.

## Reproductibilité

Depuis la racine du dépôt, avec Node 26 disponible :

```bash
cd backend && npm run typecheck && npm test -- --runInBand && npm run build
cd ../extension && npm run lint && npm run typecheck && npm test && npm run build
```

Le frontend doit être relancé après résolution de l’anomalie de la carte confidentialité. Les validations non exécutées ne doivent pas être cochées dans Trello.
