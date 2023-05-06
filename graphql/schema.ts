import { join } from 'path';
import { makeSchema, queryType, mutationType } from 'nexus';

import * as Types from './types';
import * as Project from './resolvers/Project';
import * as Goal from './resolvers/Goal';
import * as Comment from './resolvers/Comment';

const Query = queryType({
    definition(t) {
        Project.query(t);
        Goal.query(t);
        Comment.query(t);
    },
});

const Mutation = mutationType({
    definition(t) {
        Project.mutation(t);
        Goal.mutation(t);
        Comment.mutation(t);
    },
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
