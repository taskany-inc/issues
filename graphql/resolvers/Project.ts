import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import {
    SortOrder,
    Project,
    Goal,
    ProjectGoalsInput,
    ProjectDeleteInput,
    SubscriptionToggleInput,
    Activity,
    ProjectGoalsCountInput,
    ProjectUpdateInput,
    ProjectCreateInput,
} from '../types';

const connectionMap: Record<string, string> = {
    true: 'connect',
    false: 'disconnect',
};

const projectGoalsFilter = (data: {
    key: string;
    query: string;
    priority: string[];
    states: string[];
    tags: string[];
    owner: string[];
}): any => {
    const priorityFilter = data.priority.length ? { priority: { in: data.priority } } : {};

    const statesFilter = data.states.length
        ? {
              state: {
                  id: {
                      in: data.states,
                  },
              },
          }
        : {};

    const tagsFilter = data.tags.length
        ? {
              tags: {
                  some: {
                      id: {
                          in: data.tags,
                      },
                  },
              },
          }
        : {};

    const ownerFilter = data.owner.length
        ? {
              owner: {
                  id: {
                      in: data.owner,
                  },
              },
          }
        : {};

    return {
        where: {
            OR: [
                {
                    title: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
            ],
            project: {
                key: data.key,
            },
            ...priorityFilter,
            ...statesFilter,
            ...tagsFilter,
            ...ownerFilter,
            AND: {
                OR: [
                    {
                        archived: false,
                    },
                    {
                        archived: null,
                    },
                ],
            },
        },
    };
};

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
            key: nonNull(stringArg()),
        },
        resolve: async (_, { key }, { db, activity }) => {
            if (!activity) return null;

            const project = await db.project.findUnique({
                where: {
                    key,
                },
                include: {
                    flow: {
                        include: {
                            states: true,
                        },
                    },
                    stargizers: true,
                    watchers: true,
                    teams: true,
                    tags: true,
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
                            teams: true,
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

    t.list.field('projectGoals', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: ProjectGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return db.goal.findMany({
                take: data.pageSize,
                skip: data.offset,
                ...projectGoalsFilter(data),
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    owner: {
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
        },
    });

    t.int('projectGoalsCount', {
        args: {
            data: nonNull(arg({ type: ProjectGoalsCountInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return db.goal.count({
                ...projectGoalsFilter(data),
            });
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
            data: nonNull(arg({ type: ProjectUpdateInput })),
        },
        resolve: async (_, { data: { id, teams, ...data } }, { db, activity }) => {
            if (!activity) return null;

            const project = await db.project.findUnique({
                where: { id },
                include: {
                    teams: true,
                },
            });

            if (!project) return null;

            const teamsToConnect = teams.filter((teamId) => !project.teams.some((team) => team.id === teamId));
            const teamsToDisconnect = project.teams.filter((team) => !teams.includes(team.id));

            try {
                return db.project.update({
                    where: { id },
                    data: {
                        ...data,
                        teams: {
                            connect: teamsToConnect.map((id) => ({ id })),
                            disconnect: teamsToDisconnect.map((team) => ({ id: team.id })),
                        },
                    },
                    include: {
                        teams: true,
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
};
