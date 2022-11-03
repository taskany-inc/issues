import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
    /**
     * Release must be passed with SENTRY_RELEASE variable.
     */
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}
