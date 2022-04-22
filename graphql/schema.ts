import { join } from 'path';
import { makeSchema, queryType, mutationType } from 'nexus';

import * as Types from './types';
import * as User from './resolvers/User';
import * as Project from './resolvers/Project';
import * as Flow from './resolvers/Flow';
import * as Goal from './resolvers/Goal';
import * as Tag from './resolvers/Tag';

const Query = queryType({
    definition(t) {
        User.query(t);
        Project.query(t);
        Flow.query(t);
        Goal.query(t);
        Tag.query(t);
    },
});

const Mutation = mutationType({
    definition(t) {
        User.mutation(t);
        Project.mutation(t);
        Flow.mutation(t);
        Goal.mutation(t);
        Tag.mutation(t);
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
