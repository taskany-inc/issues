import { NextApiRequest } from 'next';
import pino from 'pino';

export const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
    transport: {
        targets: [
            {
                target: 'pino-pretty',
            },
            {
                target: 'pino-opentelemetry-transport',
                options: {
                    loggerName: 'pino-opentelemetry-transport',
                },
            },
        ],
    },
});

export class Logger {
    // eslint-disable-next-line no-useless-constructor
    public constructor(public handlerName: string) {}

    public infoIncomingRequest(request: NextApiRequest) {
        this.info('Incoming Request', request);
    }

    public info(message: string, request?: NextApiRequest) {
        logger.info({
            handlerName: this.handlerName,
            requestId: request?.headers['x-request-id'],
            file: __filename,
            headers: this.getHeadersArray(request),
            method: request?.method,
            url: request?.url,
            message,
        });
    }

    public error(error: Error, request?: NextApiRequest) {
        const serializedError = pino.stdSerializers.err(error);

        logger.error({
            handlerName: this.handlerName,
            requestId: request?.headers['x-request-id'],
            file: __filename,
            headers: this.getHeadersArray(request),
            method: request?.method,
            url: request?.url,
            errorType: serializedError?.type,
            stack: serializedError?.stack,
            message: serializedError?.message,
        });
    }

    private getHeadersArray(request: NextApiRequest | undefined) {
        if (!request) {
            return [];
        }

        return Object.entries(request.headers).map(([key, val]) => `${key}:${val}`);
    }
}
