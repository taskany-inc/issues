import * as trpcNext from '@trpc/server/adapters/next';
import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { trpcRouter } from '../../../../trpc/router';
import { createContext } from '../../../../trpc/context';
import getLang, { TLocale, setSSRLocale } from '../../../utils/getLang';

const errorSubstitution = <T extends { code: string; message: string; stack?: string }>(
    error: T,
    code: 'BAD_REQUEST',
) => {
    error.code = code;
    error.message = 'Something went wrong';
    delete error.stack;
};

const trpcHandler = trpcNext.createNextApiHandler({
    router: trpcRouter,
    createContext,
    onError({ error, ctx, input, path, req }) {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
            const extra = {
                error: error.cause,
                user: ctx?.session?.user,
                input,
                path,
                url: req.url,
                requestId: ctx?.headers['x-request-id'],
            };

            Sentry.captureException(error, { extra });
            console.error(extra);

            errorSubstitution(error, 'BAD_REQUEST');
        }
    },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const currentLocale = req.headers['x-issues-locale'] || getLang();

    setSSRLocale(currentLocale as TLocale);
    res.setHeader('x-issues-locale', currentLocale);

    return trpcHandler(req, res);
}
