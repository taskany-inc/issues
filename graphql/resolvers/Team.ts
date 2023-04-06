import { PrismaClient } from '@prisma/client';
import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { connectionMap } from '../queries/connections';
import { addCalclulatedGoalsFields, goalDeepQuery, goalsFilter, calcGoalsMeta } from '../queries/goals';
import {
    SortOrder,
    SubscriptionToggleInput,
    Activity,
    Team,
    TeamCreateInput,
    TeamUpdateInput,
    TeamsInput,
    TeamDeleteInput,
    Goal,
    TeamGoalsInput,
    GoalsMetaOutput,
    TransferOwnershipInput,
} from '../types';

const goalsQuery = async (
    db: PrismaClient,
    activityId: string,
    data: {
        id: string;
        query: string;
        priority: string[];
        states: string[];
        tags: string[];
        estimates: string[];
        owner: string[];
        projects: number[];
    },
) => {
    const uniqGoals = new Map();

    const [teamGoals, teamProjectsGoals] = await Promise.all([
        db.goal.findMany({
            ...goalsFilter(data, {
                AND: {
                    team: {
                        id: data.id,
                    },
                },
            }),
            include: {
                ...goalDeepQuery,
            },
        }),
        db.goal.findMany({
            ...goalsFilter(data, {
                AND: {
                    project: {
                        teams: {
                            some: {
                                id: data.id,
                            },
                        },
                    },
                },
            }),
            include: {
                ...goalDeepQuery,
            },
        }),
    ]);

    teamGoals.forEach((goal) => uniqGoals.set(goal.id, goal));
    teamProjectsGoals.forEach((goal) => uniqGoals.set(goal.id, goal));

    return Array.from(uniqGoals.values()).map((goal) => ({
        ...goal,
        ...addCalclulatedGoalsFields(goal, activityId),
    }));
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
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db, activity }) => {
            if (!activity) return null;

            return db.team.findUnique({
                where: {
                    id,
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

    t.list.field('teamGoals', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: TeamGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return goalsQuery(db, activity.id, data);
        },
    });

    t.field('teamGoalsMeta', {
        type: GoalsMetaOutput,
        args: {
            data: nonNull(arg({ type: TeamGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const allTeamGoals = await goalsQuery(db, activity.id, data);

            return calcGoalsMeta(allTeamGoals);
        },
    });

    t.list.field('teamCompletion', {
        type: Team,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
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

            const team = await db.team.findUnique({
                where: { id },
                include: {
                    projects: true,
                },
            });

            if (!team) return null;

            const projectsToConnect = projects.filter(
                (projectId) => !team.projects.some((project) => project.id === projectId),
            );
            const projectsToDisconnect = team.projects.filter((project) => !projects.includes(project.id));

            try {
                return db.team.update({
                    where: { id },
                    data: {
                        ...data,
                        children: {
                            connect: children?.map((child) => ({ id: child })),
                        },
                        projects: {
                            connect: projectsToConnect.map((id) => ({ id })),
                            disconnect: projectsToDisconnect.map((project) => ({ id: project.id })),
                        },
                    },
                    include: {
                        projects: true,
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

    t.field('transferTeamOwnership', {
        type: Team,
        args: {
            data: nonNull(arg({ type: TransferOwnershipInput })),
        },
        resolve: async (_, { data: { id, activityId } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.team.update({
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
