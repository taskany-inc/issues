import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';

import type { TrpcRouter } from '../../trpc/router';

function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // browser should use relative path
        return '';
    }
    return process.env.NEXTAUTH_URL;
}

export const trpc = createTRPCNext<TrpcRouter>({
    config: ({ ctx }) => {
        return {
            transformer: superjson,

            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    headers: async () => {
                        if (ctx?.req) {
                            // https://trpc.io/docs/nextjs/ssr#q-why-do-i-need-to-delete-the-connection-header-when-using-ssr-on-node-18
                            const { connection, ...headers } = ctx.req.headers;

                            return {
                                ...headers,
                                // Optional: inform server that it's an SSR request
                                'x-ssr': '1',
                            };
                        }

                        return {};
                    },
                }),
            ],
        };
    },
    ssr: false,
});
