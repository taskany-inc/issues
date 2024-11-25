import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';

import type { TrpcRouter } from '../../trpc/router';

import { transformer } from './transformer';

function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // browser should use relative path
        return '';
    }
    return process.env.NEXTAUTH_URL;
}

export const trpc = createTRPCNext<TrpcRouter>({
    config: ({ ctx }) => {
        const linkOptions = {
            url: `${getBaseUrl()}/api/trpc`,
            headers: async () => {
                if (ctx?.req) {
                    // https://trpc.io/docs/nextjs/ssr#q-why-do-i-need-to-delete-the-connection-header-when-using-ssr-on-node-18
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { connection, ...headers } = ctx.req.headers;

                    return {
                        ...headers,
                        // Optional: inform server that it's an SSR request
                        'x-ssr': '1',
                    };
                }

                return {};
            },
        };

        return {
            transformer,

            queryClientConfig: {
                defaultOptions: {
                    queries: {
                        /**
                         * Since we have SSR for the majority of pages,
                         * we don't need to refetch data on mount
                         * on the client by default.
                         */
                        refetchOnMount: false,
                    },
                },
            },

            links: [
                splitLink({
                    condition: (op) => {
                        return op.context.skipBatch === true;
                    },
                    true: httpLink(linkOptions),
                    false: httpBatchLink(linkOptions),
                }),
            ],
        };
    },
    ssr: false,
});
