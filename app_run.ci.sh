#!/bin/sh
npm run db:migrate
npm run db:seed
NODE_ENV=testing CREDENTIALS_AUTH=1 node_modules/.bin/concurrently -k 'node background/worker/index.js' 'node server.js'
