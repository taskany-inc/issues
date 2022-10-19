import type { Session } from 'next-auth';

import { createClient, QueryRequest } from '../../graphql/@generated/genql';

export function createFetcher(cb: (user?: Session['user'], ...args: any[]) => QueryRequest) {
    return (user?: Session['user'], ...rest: any[]) => {
        const gql = createClient({
            fetcher: (operation) =>
                fetch(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/graphql`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...(user ? { 'x-id': user.id } : {}),
                    },
                    body: JSON.stringify(operation),
                }).then((response) => response.json()),
        });

        return gql.query(cb(user, ...rest));
    };
}
