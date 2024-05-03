export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        import('pino-pretty');
        import('pino-opentelemetry-transport');

        await import('./instrumentation.node');
    }
}
