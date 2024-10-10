// eslint-disable-next-line no-console
export const log = (...rest: unknown[]) => console.log('[WORKER]:', ...rest.concat(`at ${new Date().toUTCString()}`));
