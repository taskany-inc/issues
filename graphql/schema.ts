import { join } from 'path';
import { makeSchema, queryType, mutationType } from 'nexus';

import * as Types from './types';

const Query = queryType({
    definition(t) {},
});

const Mutation = mutationType({
    definition(t) {},
});

export const schema = makeSchema({
    types: [Query, Mutation, Types],
    outputs: {
        schema: join(process.cwd(), 'graphql/schema.graphql'),
        typegen: join(process.cwd(), 'graphql/@generated/nexus.d.ts'),
    },
    contextType: {
        module: join(process.cwd(), 'graphql/context.ts'),
        export: 'Context',
    },
    sourceTypes: {
        modules: [
            {
                module: '@prisma/client',
                alias: 'db',
            },
        ],
    },
    plugins: [],
});
