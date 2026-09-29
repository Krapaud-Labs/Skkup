# Audit complet du projet et tests réels navigateur

## Périmètre et état

- Carte Trello : [P06 Audit complet du projet et tests réels navigateur](https://trello.com/c/gPrNyuLA/76-p06-audit-complet-du-projet-et-tests-r%C3%A9els-navigateur).
- Branche de travail : `feature/p06-finish`, issue de `origin/dev`.
- Revalidation : 29 septembre 2026.
- L’audit couvre le backend, le frontend, l’extension, la CI, Docker, les secrets, la navigation publique et les parcours accessibles sans compte.

## Contrôles exécutés

| Domaine | Contrôle | Résultat | Preuve ou limite |
| --- | --- | --- | --- |
| Git | État, branche et changements non commités | OK | Branche dédiée propre avant livraison du rapport. |
| Backend | Lint, typecheck, tests et build | OK | 34 suites et 252 tests réussis, puis build réussi. |
| Frontend | Lint, typecheck, tests et build | OK | Lint, typecheck, 23 suites et 70 tests, puis build réussis après intégration de la correction confidentialité. |
| Extension | Lint, typecheck, tests et build | OK | 9 suites et 56 tests réussis, puis build réussi. |
| CI | Workflows de documentation, frontend, backend, extension et Docker | OK | CI de la PR P02 fusionnée vers `dev` verte, incluant les quatre jobs applicatifs et Docker. |
| Docker et production | Services Skkup sur le VPS | OK | PostgreSQL, Redis, backend, worker et frontend sont actifs et healthy après reconstruction depuis le commit `5419dad`. |
| Navigation publique | Accueil, navigation vitrine, confidentialité et règlement | OK | Vérification Chrome réelle en français et en anglais. Les liens de navigation et le lien vers `/reglement` répondent. |
| Internationalisation publique | Sélecteur FR/EN et rendu de confidentialité | OK | Le sélecteur bascule le contenu et la navigation entre français et anglais sur `https://skkup.fr/confidentialite`. |
| Inscription | Affichage et contraintes du mot de passe | OK partiel | Chrome affiche les quatre contraintes et leur état évolutif avec une valeur de test invalide. Aucun compte réel n’a été créé. |
| Sécurité et secrets | Fichiers suivis et configuration | OK partiel | Aucun secret réel dans les fichiers suivis. La revue complète auth, IDOR, fraude et rate limiting nécessite des scénarios authentifiés dédiés. |
| Dépendances | Audit npm | Non prouvé | Le registre npm n’était pas disponible pendant l’audit initial. |
| Documentation | Lint Markdown complet | Non prouvé | Le rapport ne déclare pas ce contrôle validé sans exécution reproductible de l’outil. |
| Responsive | Desktop, tablette et mobile | Non prouvé | Le rendu desktop est observé. Les viewports tablette et mobile doivent encore être capturés et vérifiés séparément. |
| Authentification | Inscription réelle, connexion, déconnexion et session | OK partiel | Le formulaire, la connexion, la session dashboard et la déconnexion ont été vérifiés dans Chrome avec le compte de test autorisé. Aucun nouveau compte n’a été créé. |
| Administration | Dashboard et contrôle d’accès | OK | L’accès au dashboard administrateur a été vérifié dans Chrome avec le compte de test autorisé. |

## Anomalies et limites restantes

1. Le parcours authentifié et l’accès administrateur ont été revalidés avec le compte de test autorisé.
2. Le contrôle responsive doit être réalisé avec des viewports desktop, tablette et mobile documentés.
3. La migration Dokploy avait révélé une incohérence d’identifiants PostgreSQL persistants. Le rôle a été réaligné sur le secret déjà configuré, puis la migration a confirmé qu’aucune migration n’était en attente. Aucun volume ni aucune donnée n’a été supprimé.
4. La validation juridique de la politique de confidentialité reste une validation humaine et n’est pas simulée par cet audit.

## Reproductibilité

Depuis la racine du dépôt :

```bash
cd backend && npm run lint && npm run typecheck && npm test -- --runInBand && npm run build
cd ../frontend && npm run lint && npm run typecheck && npm test -- --runInBand && npm run build
cd ../extension && npm run lint && npm run typecheck && npm test && npm run build
```

Les contrôles non prouvés restent explicitement ouverts dans Trello.
