# Frontend Viewer Rewards

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Sora](https://fonts.google.com/specimen/Sora), la police retenue pour le design system.

## Design system

La palette « gamer néon » et les composants réutilisables (`CarteGlow`,
`BoutonCTA`, `BandeauStats`, `BarreProgressionStreak`) vivent dans
`src/components/ui/`, avec leurs tokens définis dans `src/app/globals.css`
(voir `docs/06-frontend-design-system.md` pour la spécification complète).

## Authentification

Les pages `/connexion` et `/inscription` partagent le composant
`src/components/auth/FormulaireAuth.tsx` et s'appuient sur
`src/lib/auth.ts`.

La session n'est pas stockée par le frontend : `POST /auth/login` et
`POST /auth/register` ne renvoient que `{ pseudo }` et posent le jeton
dans un cookie `httpOnly`, inaccessible au JavaScript de la page. Le
client se contente d'émettre ses requêtes avec `credentials: "include"`,
ce que centralise `fetchAuthentifie()` ; sans cette option le cookie ne
part pas et le backend répond `401`. La déconnexion passe obligatoirement
par `POST /auth/logout`, seul moyen d'effacer un cookie `httpOnly`.

Le contrat complet est décrit dans `docs/04-api-contract.md` (section
Authentification).

## Variables d'environnement

- `NEXT_PUBLIC_API_URL` : URL de base de l'API backend, appelée
  directement depuis le navigateur (`http://localhost:3001` par défaut en
  développement).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
