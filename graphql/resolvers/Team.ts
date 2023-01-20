import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';
import slugify from 'slugify';

import {
    SortOrder,
    SubscriptionToggleInput,
    Activity,
    Team,
    TeamProjectsInput,
    TeamCreateInput,
    TeamUpdateInput,
    TeamsInput,
    TeamDeleteInput,
    Project,
    Goal,
    TeamGoalsInput,
} from '../types';

const connectionMap: Record<string, string> = {
    true: 'connect',
    false: 'disconnect',
};

const projectGoalsFilter = (
    data: { query: string; states: string[]; tags: string[]; owner: string[] },
    extra: any = {},
): any => {
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
            ...statesFilter,
            ...tagsFilter,
            ...ownerFilter,
            ...extra,
        },
    };
};

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('teams', {
        type: Team,
        args: {
            data: nonNull(arg({ type: TeamsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const teams = await db.team.findMany({
                where: {
                    title: data.title ?? undefined,
                },
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    projects: true,
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                },
            });

            if (!teams.length) return [];

            return teams;
        },
    });

    t.field('team', {
        type: Team,
        args: {
            slug: nonNull(stringArg()),
        },
        resolve: async (_, { slug }, { db, activity }) => {
            if (!activity) return null;

            return db.team.findUnique({
                where: {
                    slug,
                },
                include: {
                    projects: {
                        include: {
                            activity: {
                                include: {
                                    user: true,
                                    ghost: true,
                                },
                            },
                        },
                    },
                    watchers: true,
                    stargizers: true,
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
                            projects: true,
                        },
                    },
                },
            });
        },
    });

    t.list.field('teamProjects', {
        type: Project,
        args: {
            data: nonNull(arg({ type: TeamProjectsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return db.project.findMany({
                where: {
                    teams: {
                        some: {
                            slug: data.slug,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    goals: {
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
                    },
                },
            });
        },
    });

    t.list.field('teamGoals', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: TeamGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return db.goal.findMany({
                ...projectGoalsFilter(data, {
                    team: {
                        slug: data.slug,
                    },
                }),
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    team: true,
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

    t.list.field('teamCompletion', {
        type: Team,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
        // eslint-disable-next-line no-shadow
        resolve: async (_, { sortBy, query }, { db }) => {
            if (query === '') {
                return [];
            }

            return db.team.findMany({
                orderBy: { createdAt: sortBy || undefined },
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                include: {
                    flow: true,
                    activity: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createTeam', {
        type: Team,
        args: {
            data: nonNull(arg({ type: TeamCreateInput })),
        },
        resolve: async (_, { data: { key, title, parent, description, flowId } }, { db, activity }) => {
            if (!activity) return null;

            let parentTeam;

            if (parent) {
                parentTeam = await db.team.findUnique({
                    where: {
                        id: parent,
                    },
                });
            }

            try {
                const newTeam = await db.team.create({
                    data: {
                        key,
                        slug: slugify(title, {
                            replacement: '_',
                            lower: true,
                            strict: true,
                        }),
                        title,
                        description,
                        flowId,
                        activityId: activity.id,
                        watchers: {
                            connect: [activity.id].map((id) => ({ id })),
                        },
                    },
                });

                if (parentTeam) {
                    await db.team.update({
                        where: {
                            id: parentTeam.id,
                        },
                        data: {
                            children: {
                                connect: [{ id: newTeam.id }],
                            },
                        },
                    });
                }

                return newTeam;

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

    t.field('updateTeam', {
        type: Team,
        args: {
            data: nonNull(arg({ type: TeamUpdateInput })),
        },
        resolve: async (_, { data: { id, parent, children, projects, ...data } }, { db, activity }) => {
            if (!activity) return null;

            if (parent) {
                try {
                    await db.team.update({
                        where: {
                            id: parent,
                        },
                        data: {
                            children: {
                                connect: [{ id }],
                            },
                        },
                    });
                } catch (error) {
                    throw Error(`${error}`);
                }
            }

            // TODO: filter projects and children to disconnect

            try {
                return db.team.update({
                    where: { id },
                    data: {
                        ...data,
                        children: {
                            connect: children?.map((child) => ({ id: child })),
                        },
                        projects: {
                            connect: projects?.map((p) => ({ key: p })),
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

    t.field('deleteTeam', {
        type: Team,
        args: {
            data: nonNull(arg({ type: TeamDeleteInput })),
        },
        resolve: async (_, { data: { id } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.team.delete({
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

    t.field('toggleTeamWatcher', {
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
                        teamWatchers: { [connectionMap[String(direction)]]: connection },
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

    t.field('toggleTeamStargizer', {
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
                        teamStargizers: { [connectionMap[String(direction)]]: connection },
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
