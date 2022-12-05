# START DEPS IMAGE

FROM node:16.14.2-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm ci

# END DEPS IMAGE

# START BUILD IMAGE

FROM node:16.14.2-alpine AS build

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
# RUN npm run build

ARG NEXTAUTH_URL
ENV NEXT_PUBLIC_NEXTAUTH_URL=$NEXTAUTH_URL

ARG GRAVATAR_HOST
ENV NEXT_PUBLIC_GRAVATAR_HOST=$GRAVATAR_HOST

ARG MAIL_USER
ENV MAIL_USER=$MAIL_USER

RUN npm run build

# END BUILD IMAGE

# START RUNNER IMAGE

FROM node:16.14.2-alpine AS runner

ENV NODE_ENV production

WORKDIR /app
COPY --from=build --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/app_run.sh ./app_run.sh

EXPOSE 3000

CMD sh ./app_run.sh

# END RUNNER IMAGE
