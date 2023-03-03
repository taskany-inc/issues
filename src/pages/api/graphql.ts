import { NextApiRequest, NextApiResponse } from 'next';
import { ApolloServer } from 'apollo-server-micro';
import { getSession } from 'next-auth/react';

import { prisma } from '../../utils/prisma';
import { schema } from '../../../graphql/schema';

const apolloServer = new ApolloServer({
    schema,
    context: async ({ req }) => {
        const user = req.headers['x-id']
            ? await prisma.user.findUnique({
                  where: { id: req.headers['x-id'] },
                  include: {
                      activity: true,
                  },
              })
            : null;

        return { db: prisma, req, user, activity: user?.activity };
    },
});
const startServer = apolloServer.start();

export default async (req: NextApiRequest, res: NextApiResponse) => {
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
};

export const config = {
    api: {
        bodyParser: false,
    },
};
