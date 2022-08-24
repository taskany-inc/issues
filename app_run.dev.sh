#!/bin/sh
npx prisma migrate dev --preview-feature
npm run start
