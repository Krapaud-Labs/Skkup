# Frontend Skkup

Application web Next.js de Skkup. Elle fournit l'interface gamer
néon, l'authentification par cookie de session et le visionnage des chaînes
partenaires.

## Démarrage

```bash
npm install
npm run dev
```

L'application est accessible sur <http://localhost:3000>. L'API backend doit
être disponible à l'adresse définie par `NEXT_PUBLIC_API_URL`.

La police Sora est chargée avec `next/font`. Le build de production nécessite
donc un accès à Google Fonts tant que la police n'est pas auto-hébergée.

## Design system

La palette « gamer néon » et les composants réutilisables (`CarteGlow`,
`BoutonCTA`, `BandeauStats`, `BarreProgressionStreak`) vivent dans
`src/components/ui/`, avec leurs tokens définis dans `src/app/globals.css`.
Voir `docs/06-frontend-design-system.md` pour la spécification complète.

## Authentification

Les pages `/connexion` et `/inscription` partagent le composant
`src/components/auth/FormulaireAuth.tsx` et s'appuient sur
`src/lib/auth.ts`.

La session n'est pas stockée par le frontend. `POST /auth/login` et
`POST /auth/register` ne renvoient que `{ pseudo }` et posent le jeton dans un
cookie `httpOnly`, inaccessible au JavaScript de la page. Les requêtes
authentifiées utilisent `credentials: "include"` par l'intermédiaire de
`fetchAuthentifie()`. La déconnexion passe par `POST /auth/logout`.

Le contrat complet est décrit dans `docs/04-api-contract.md`.

## Streams et suivi par extension

La page `/streams` charge le catalogue public avec `GET /streams`. Le site ne
reproduit pas les directs. L'utilisateur ouvre la plateforme de son choix et
l'extension Skkup suit le visionnage.

Lorsque l'extension signale une présence active, le hook
`useSessionVisionnage` :

1. ouvre une session avec `POST /watch-sessions` ;
2. envoie un heartbeat toutes les 30 secondes pendant la lecture ;
3. affiche les points éventuellement confirmés par le backend ;
4. clôt la session au démontage ou au changement de chaîne.

Le backend reste seul responsable de la validation temporelle, de
l'anti-fraude et du crédit des points. Les sessions web ne créditent aucun
point : seule l'extension appariée peut ouvrir et alimenter une session.

## Tableau de bord et temps réel

La page `/dashboard` (`src/components/dashboard/TableauDeBord.tsx`) affiche
le solde de points, l'historique paginé, la progression de série, les cartes
à gratter disponibles et les tickets de tirage de l'utilisateur connecté.
Elle charge ces données par l'API REST au montage puis se connecte à la
Gateway temps réel (`src/lib/temps-reel.ts`, Socket.io) pour recevoir les
événements `points:updated`, `streak:updated` et `scratch-card:unlocked` de
sa room privée et patcher l'état local sans nouvel appel REST. Le WebSocket
est un confort : une connexion absente ou coupée laisse la page utilisable
avec les données déjà chargées.

## Internationalisation et accessibilité

Le site prend en charge le français et l’anglais, avec détection du navigateur,
sélecteur manuel et mémorisation locale du choix. Les libellés visibles et les
libellés d’accessibilité du dashboard suivent la langue active. Les règles de
traduction et les limites de validation juridique sont détaillées dans
`docs/13-internationalisation.md`.

## Variable d'environnement

- `NEXT_PUBLIC_API_URL` : URL de base de l'API backend, appelée directement
  depuis le navigateur. Valeur par défaut : `http://localhost:3001`. Le build
  Docker la transmet à Next.js et ajoute automatiquement son origine HTTP et
  WebSocket à la directive CSP `connect-src`.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
