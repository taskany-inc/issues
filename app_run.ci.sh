#!/bin/sh
npx prisma migrate deploy
npx prisma db seed
node_modules/.bin/concurrently 'node background/worker/index.js' 'node server.js'
