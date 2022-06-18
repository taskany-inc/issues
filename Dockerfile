
# START DEPS IMAGE

FROM node:16-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# END DEPS IMAGE

# START BUILD IMAGE

FROM node:16-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://prisma:hilly-sand-pit@localhost:5432/prisma?schema=prisma-pg-test
RUN npx prisma generate
RUN npm run build

# END BUILD IMAGE

# START RUNNER IMAGE

FROM node:16-alpine AS runner

ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN apk update && apk add curl

WORKDIR /app
COPY --from=build --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/app_run.sh ./app_run.sh

USER nextjs

EXPOSE 3000
CMD sh ./app_run.sh

# END RUNNER IMAGE
