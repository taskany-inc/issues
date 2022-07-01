import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { SortOrder, Project, computeUserFields, withComputedField, Goal } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('project', {
        type: Project,
        args: {
            key: nonNull(stringArg()),
        },
        resolve: async (_, { key }, { db, activity }) => {
            if (!activity) return null;

            const project = await db.project.findUnique({
                where: {
                    key,
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                },
            });

            if (!project) return null;

            return withComputedField('owner')(project);
        },
    });

    t.list.field('projectGoals', {
        type: Goal,
        args: {
            key: nonNull(stringArg()),
        },
        resolve: async (_, { key }, { db, activity }) => {
            if (!activity) return null;

            const goals = await db.goal.findMany({
                where: {
                    project: {
                        key,
                    },
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    issuer: {
                        ...computeUserFields,
                    },
                },
            });

            return goals.map(withComputedField('owner', 'issuer'));
        },
    });

    t.list.field('projectCompletion', {
        type: Project,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
        // eslint-disable-next-line no-shadow
        resolve: async (_, { sortBy, query }, { db }) => {
            if (query === '') {
                return [];
            }

            return db.project.findMany({
                orderBy: { createdAt: sortBy || undefined },
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                include: {
                    owner: {
                        include: {
                            user: true,
                        },
                    },
                    flow: {
                        include: {
                            states: true,
                        },
                    },
                },
            });
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createProject', {
        type: Project,
        args: {
            key: nonNull(stringArg()),
            title: nonNull(stringArg()),
            description: stringArg(),
            ownerId: nonNull(stringArg()),
            flowId: nonNull(stringArg()),
        },
        resolve: async (_, { key, title, description, ownerId, flowId }, { db, activity }) => {
            if (!activity) return null;

            const projectOwner = await db.user.findUnique({ where: { id: ownerId }, include: { activity: true } });
            const resolvedOwnerId = projectOwner?.activity?.id || activity.id;

            try {
                return db.project.create({
                    data: {
                        key,
                        title,
                        description,
                        ownerId: resolvedOwnerId,
                        flowId,
                    },
                });

                // await mailServer.sendMail({
                //     from: '"Fred Foo 👻" <foo@example.com>',
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
