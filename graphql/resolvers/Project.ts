import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';
import slugify from 'slugify';

import { SortOrder, Project, computeOwnerFields, withComputedOwner, Goal, UserSession } from '../types';

const slugifyOptions = {
    replacement: '_',
    lower: true,
    strict: true,
};

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('project', {
        type: Project,
        args: {
            slug: nonNull(stringArg()),
        },
        resolve: async (_, { slug }, { db }) => {
            const project = await db.project.findUnique({
                where: {
                    slug,
                },
                include: {
                    owner: {
                        ...computeOwnerFields,
                    },
                },
            });

            return withComputedOwner(project);
        },
    });

    t.list.field('projectGoals', {
        type: Goal,
        args: {
            slug: nonNull(stringArg()),
        },
        resolve: async (_, { slug }, { db }) => {
            const goals = await db.goal.findMany({
                where: {
                    project: {
                        slug,
                    },
                },
                include: {
                    owner: {
                        ...computeOwnerFields,
                    },
                },
            });

            return goals.map(withComputedOwner);
        },
    });

    t.list.field('projectCompletion', {
        type: Project,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
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
            title: nonNull(stringArg()),
            description: stringArg(),
            ownerId: nonNull(stringArg()),
            flowId: nonNull(stringArg()),
            user: nonNull(arg({ type: UserSession })),
        },
        resolve: async (_, { user, title, description, ownerId, flowId }, { db }) => {
            const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });
            const projectOwner = await db.user.findUnique({ where: { id: ownerId }, include: { activity: true } });

            if (!validUser) return null;

            const resolvedOwnerId = projectOwner?.activity?.id || validUser.activity?.id;

            try {
                const newProject = db.project.create({
                    data: {
                        slug: slugify(title, slugifyOptions),
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

                return newProject;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
