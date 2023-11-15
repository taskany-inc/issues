# Taskany

<img width="640" alt="Taskany" src="https://user-images.githubusercontent.com/982072/186257262-6f79ee44-f949-48b9-a12e-23fd659a7f6f.png">

## Docker

Docker is the recommended way to run **Taskany Issues** – updated Docker images based on Alpine Linux are available on a weekly release cadence and are tested by the maintaining team.

### Configuration

Using this [sample file](https://github.com/taskany-inc/issues/blob/main/.env.example) as a reference create a `.env` file to contain the environment variables for your installation.

### Docker Compose

It is recommended to use Docker Compose to manage the various docker containers, if your Postgres is running in the cloud then you may skip this step and run the single **Taskany Issues** docker container directly.

1. [Install Docker Compose](https://docs.docker.com/compose/install/).
2. Create a `docker-compose.yml` file, an example configuration with all dependencies dockerized and environment variables kept in `.env` is as follows.

```yml
version: '3'
services:
    db:
        image: postgres:11.6
        container_name: postgres
        env_file: ./.env
        ports:
            - 5432:5432
        volumes:
            - ./postgres/data:/var/lib/postgresql/data
    taskany_issues:
        image: taskany/issues:latest
        env_file: ./.env
        depends_on:
            - db
        ports:
            - 3000:3000
        healthcheck:
            test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/auth/signin']
            interval: 3s
            timeout: 10s
            retries: 3
```

It is recommended to pin the version of the image rather than relying on the latest tag so that you can remain in control of upgrades, eg image: `taskany/issues:1.0.0`.

### Running

Make sure you are in the same directory as `docker-compose.yml` and start **Taskany Issues**:

> docker-compose up -d

### Database

Migrate the database to add needed tables, indexes, etc:

> docker-compose run --rm taskany_issues npm run db:migrate

### Seed

If you want to test **Taskany Issues** with some promo data:

> docker-compose run --rm taskany_issues npm run db:seed

## Enterprise

If you are installing the enterprise edition the image name should be `taskany/issues-enterprise`. Firstly you need to create custom `Dockerfile` based on enterprise image:

```
FROM taskany/issues-enterprise as build

WORKDIR /app
COPY .taskany.config.json .
RUN npm ci
RUN npm run build

FROM node:18.12.0-alpine AS runner

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

CMD ["node_modules/.bin/concurrently", "node background/worker/index.js", "node server.js"]
```

Then use this `Dockerfile` with Docker Compose is as follows:

```yml
version: '3'
services:
    db:
        image: postgres:11.6
        container_name: postgres
        env_file: ./.env
        ports:
            - 5432:5432
        volumes:
            - ./postgres/data:/var/lib/postgresql/data
    taskany_issues:
        container_name: issues
        env_file: ./.env
        stdin_open: true
        build:
            context: .
            dockerfile: Dockerfile
        depends_on:
            - db
        ports:
            - 3000:3000
        healthcheck:
            test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/auth/signin']
            interval: 3s
            timeout: 10s
            retries: 3
```

## Monitoring

### OpenTelemetry

Taskany can send request traces to an [OpenTelemetry Collector](https://opentelemetry.io/docs/collector). To use this feature specify the collector endpoint with `OTEL_EXPORTER_OTLP_ENDPOINT`.

⚠️ GRPC protocol is not supported

_(optional)_ Set the `TASKANY_OPEN_TELEMETRY_SERVICE_NAME` environment variable to be the declared service name.

## Contributing

Please follow [code of conduct](https://github.com/taskany-inc/issues/blob/main/CODE_OF_CONDUCT.md) first. Than use instructions in [contributing guide](https://github.com/taskany-inc/issues/blob/main/CONTRIBUTING.md) to create your first PR.

## License

[MIT](https://github.com/taskany-inc/issues/blob/main/LICENSE)
