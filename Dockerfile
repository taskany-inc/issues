FROM node:20.9.0-alpine as build

WORKDIR /app
COPY . .
RUN npm ci --no-audit --progress=false
RUN npm run build

FROM node:20.9.0-alpine AS runner

WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/public ./public
COPY --from=build /app/version ./public/version.txt
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.js ./
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/background ./background

RUN npm ci --only=production --ignore-scripts && npm cache clean --force
RUN npx prisma generate

EXPOSE 3000

CMD ["node_modules/.bin/concurrently", "-k", "node background/worker/index.js", "node server.js"]
