#!/bin/sh
npm run db:migrate
npm run db:seed
node_modules/.bin/concurrently 'node background/worker/index.js' 'node server.js'
