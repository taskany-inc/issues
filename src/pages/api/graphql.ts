/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { NextApiRequest, NextApiResponse } from 'next';
import { ApolloServer } from 'apollo-server-micro';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { getSession } from 'next-auth/react';

import { context } from '../../../graphql/context';
import { schema } from '../../../graphql/schema';

const Cors = require('micro-cors');
// https://studio.apollographql.com/
const cors = Cors();
const apolloServer = new ApolloServer({
    schema,
    context: async ({ req }) => {
        const user = req.headers['x-id']
            ? await context.db.user.findUnique({
                  where: { id: req.headers['x-id'] },
                  include: {
                      activity: true,
                  },
              })
            : null;

        return { ...context, req, user, activity: user?.activity };
    },
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground(), require('apollo-tracing').plugin()],
});
const startServer = apolloServer.start();

export default cors(async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'OPTIONS') {
        res.end();
        return false;
    }

    const session = await getSession({ req });
    req.headers['x-id'] = req.headers['x-id'] || session?.user.id;

    await startServer;
    return apolloServer.createHandler({
        path: '/api/graphql',
    })(req, res);
});

export const config = {
    api: {
        bodyParser: false,
    },
};
