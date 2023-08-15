#!/bin/sh
export DATABASE_URL=postgresql://prisma:hilly-sand-pit@localhost:5432/e2e
npm run db:reset
npm run db:seed
npm run dev
