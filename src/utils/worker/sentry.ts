import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.2,
        release: process.env.SENTRY_RELEASE,
    });

    Sentry.setTags({
        'service.type': 'worker',
    });

    console.info('Sentry initialized for worker');
}

export default Sentry;
