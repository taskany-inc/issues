import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { connectionMap } from '../queries/connections';
import { calcGoalsMeta, goalDeepQuery, goalsFilter } from '../queries/goals';
import {
    SortOrder,
    Project,
    ProjectInput,
    ProjectDeleteInput,
    SubscriptionToggleInput,
    Activity,
    ProjectUpdateInput,
    ProjectCreateInput,
    TransferOwnershipInput,
    ProjectDeepInput,
    ProjectDeepOutput,
} from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('projects', {
        type: Project,
        resolve: async (_, __, { db, activity }) => {
            if (!activity) return null;

            const projects = await db.project.findMany({
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                },
            });

            if (!projects.length) return [];

            return projects;
        },
    });

    t.field('project', {
        type: Project,
        args: {
            data: nonNull(arg({ type: ProjectInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const project = await db.project.findUnique({
                where: {
                    id: data.id,
                },
                include: {
                    stargizers: true,
                    watchers: true,
                    parent: true,
                    tags: true,
                    children: {
                        include: {
                            parent: true,
                        },
                    },
                    participants: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                    _count: {
                        select: {
                            stargizers: true,
                            watchers: true,
                            participants: true,
                            children: true,
                        },
                    },
                },
            });

            if (!project) return null;

            return {
                ...project,
                _isStarred: project.stargizers.filter((stargizer) => stargizer?.id === activity.id).length > 0,
                _isWatching: project.watchers.filter((watcher) => watcher?.id === activity.id).length > 0,
            };
        },
    });

    t.field('projectDeepInfo', {
        type: ProjectDeepOutput,
        args: {
            data: nonNull(arg({ type: ProjectDeepInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const [allProjectGoals, filtredProjectGoals] = await Promise.all([
                db.goal.findMany({
                    ...goalsFilter(
                        {
                            priority: [],
                            states: [],
                            tags: [],
                            estimates: [],
                            owner: [],
                            projects: [],
                            query: '',
                        },
                        {
                            OR: [
                                {
                                    projectId: data.id,
                                },
                                {
                                    project: {
                                        parent: {
                                            some: {
                                                id: data.id,
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    ),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
                db.goal.findMany({
                    ...goalsFilter(data, {
                        OR: [
                            {
                                projectId: data.id,
                            },
                            {
                                project: {
                                    parent: {
                                        some: {
                                            id: data.id,
                                        },
                                    },
                                },
                            },
                        ],
                    }),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
            ]);

            return {
                goals: filtredProjectGoals,
                // TODO: try to solve types collision
                meta: calcGoalsMeta(allProjectGoals as any),
            };
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
            data: nonNull(arg({ type: ProjectCreateInput })),
        },
        resolve: async (_, { data: { id, title, description, flowId } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.create({
                    data: {
                        id,
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
            data: nonNull(arg({ type: ProjectUpdateInput })),
        },
        resolve: async (_, { data: { id, parent, ...data } }, { db, activity }) => {
            if (!activity) return null;

            const project = await db.project.findUnique({
                where: { id },
                include: {
                    parent: true,
                },
            });

            if (!project) return null;

            // TODO: support children

            const parentsToConnect = parent.filter((parentId) => !project.parent.some((p) => p.id === parentId));
            const parentsToDisconnect = project.parent.filter((p) => !parent.includes(p.id));

            try {
                return db.project.update({
                    where: { id },
                    data: {
                        ...data,
                        parent: {
                            connect: parentsToConnect.map((id) => ({ id })),
                            disconnect: parentsToDisconnect.map((p) => ({ id: p.id })),
                        },
                    },
                    include: {
                        parent: true,
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

    t.field('deleteProject', {
        type: Project,
        args: {
            data: nonNull(arg({ type: ProjectDeleteInput })),
        },
        resolve: async (_, { data: { id } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.delete({
                    where: { id },
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
            data: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { data: { id, direction } }, { db, activity }) => {
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

    t.field('toggleProjectStargizer', {
        type: Activity,
        args: {
            data: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { data: { id, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id: Number(id) };

            try {
                return db.activity.update({
                    where: { id: activity.id },
                    data: {
                        projectStargizers: { [connectionMap[String(direction)]]: connection },
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

    t.field('transferProjectOwnership', {
        type: Project,
        args: {
            data: nonNull(arg({ type: TransferOwnershipInput })),
        },
        resolve: async (_, { data: { id, activityId } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.project.update({
                    where: { id },
                    data: {
                        activityId,
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
