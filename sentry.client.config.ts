import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    /**
     * Release must be passed with SENTRY_RELEASE variable.
     */
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}
