import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import {
    SortOrder,
    Project,
    computeUserFields,
    withComputedField,
    Goal,
    ProjectGoalsInput,
    ProjectInputType,
    ProjectDeleteType,
    SubscriptionInput,
    Activity,
} from '../types';

const connectionMap: Record<string, string> = {
    true: 'connect',
    false: 'disconnect',
};

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('projects', {
        type: Project,
        resolve: async (_, __, { db, activity }) => {
            if (!activity) return null;

            const projects = await db.project.findMany({
                include: {
                    activity: {
                        ...computeUserFields,
                    },
                },
            });

            if (!projects.length) return [];

            return projects.map(withComputedField('owner', 'activity'));
        },
    });

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
                    flow: true,
                    watchers: true,
                    activity: {
                        ...computeUserFields,
                    },
                },
            });

            if (!project) return null;

            return withComputedField('activity')(project);
        },
    });

    t.list.field('projectGoals', {
        type: Goal,
        args: {
            projectGoals: nonNull(arg({ type: ProjectGoalsInput })),
        },
        resolve: async (_, { projectGoals }, { db, activity }) => {
            if (!activity) return null;

            const stateFilter = projectGoals.states.length
                ? {
                      state: {
                          id: {
                              in: projectGoals.states,
                          },
                      },
                  }
                : {};

            const goals = await db.goal.findMany({
                take: projectGoals.pageSize,
                skip: projectGoals.offset,
                where: {
                    OR: [
                        {
                            title: {
                                contains: projectGoals.query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: projectGoals.query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    project: {
                        key: projectGoals.key,
                    },
                    ...stateFilter,
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    activity: {
                        ...computeUserFields,
                    },
                    tags: true,
                    state: true,
                    project: true,
                    estimate: true,
                    dependsOn: {
                        include: {
                            state: true,
                        },
                    },
                    relatedTo: {
                        include: {
                            state: true,
                        },
                    },
                    blocks: {
                        include: {
                            state: true,
                        },
                    },
                    comments: true,
                },
            });

            return goals.map(withComputedField('owner', 'activity'));
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
                    activity: {
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
            data: nonNull(arg({ type: ProjectInputType })),
        },
        resolve: async (_, { data: { key, title, description, flowId } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.create({
                    data: {
                        key,
                        title,
                        description,
                        activityId: activity.id,
                        flowId,
                        watchers: {
                            connect: [activity.id].map((id) => ({ id })),
                        },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('updateProject', {
        type: Project,
        args: {
            data: nonNull(arg({ type: ProjectInputType })),
        },
        resolve: async (_, { data: { key, ...data } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.update({
                    where: { key },
                    data,
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('deleteProject', {
        type: Project,
        args: {
            data: nonNull(arg({ type: ProjectDeleteType })),
        },
        resolve: async (_, { data: { key } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.delete({
                    where: { key },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('toggleProjectWatcher', {
        type: Activity,
        args: {
            toggle: nonNull(arg({ type: SubscriptionInput })),
        },
        resolve: async (_, { toggle: { id, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id: Number(id) };

            try {
                return db.activity.update({
                    where: { id: activity.id },
                    data: {
                        projectWatchers: { [connectionMap[String(direction)]]: connection },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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
