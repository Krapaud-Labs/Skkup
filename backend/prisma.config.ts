// Prisma charge cette configuration avec les dépendances de développement
// `prisma` et `dotenv` avant toute génération ou migration du schéma.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
