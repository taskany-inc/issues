# Taskany

<img width="640" alt="Taskany" src="https://user-images.githubusercontent.com/982072/186257262-6f79ee44-f949-48b9-a12e-23fd659a7f6f.png">

## Development

__Prepare env, first!__

> npm run db:run

It ups Postgres, [Maildev](http://maildev.github.io/maildev) and [localstack](https://github.com/localstack/localstack).

### Seed

This command adds default admin user and default flows with states.

> ADMIN_EMAIL="" ADMIN_PASSWORD="" prisma db seed

And you are ready!

> npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see [Taskany](taskany.org).

## Environment configuration

Any of variables below can be added via `.env` file, Docker env in `Dockerfile` or CLI args for container.

### DB

```
DATABASE_URL=
```

### S3

If no env variable provided Taskany uses fs storage for uploads.

```
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET=
S3_BUCKET=
S3_PATH_STYLE=
S3_TLS=
```

### E-Mails

Taskany uses [Nodemailer](https://nodemailer.com) as provider.

```
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
```

### Auth

Taskany uses [NextAuth.js](https://next-auth.js.org/). Check [docs](https://next-auth.js.org/providers/) for providers.

```
NEXTAUTH_URL=
NEXT_PUBLIC_NEXTAUTH_URL=
NEXTAUTH_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

KEYCLOAK_ID=
KEYCLOAK_SECRET=
KEYCLOAK_ISSUER=
```

## License

[MIT](https://github.com/taskany-inc/issues/blob/main/LICENSE)



