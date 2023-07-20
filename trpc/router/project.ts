import { Activity, Prisma, Project, User } from '@prisma/client';
import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import {
    projectCreateSchema,
    projectTransferOwnershipSchema,
    projectUpdateSchema,
    projectSuggestionsSchema,
} from '../../src/schema/project';
import {
    addCalclulatedGoalsFields,
    calcGoalsMeta,
    getEstimateListFormJoin,
    goalDeepQuery,
    goalsFilter,
} from '../queries/goals';
import { ToggleSubscriptionSchema, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { getProjectSchema } from '../queries/project';

type WithId = { id: string };

export const addCalculatedProjectFields = <
    T extends { watchers?: WithId[]; stargizers?: WithId[]; activityId?: string },
>(
    project: T,
    activityId: string,
): T & {
    _isWatching?: boolean;
    _isStarred?: boolean;
    _isOwner: boolean;
} => {
    const _isWatching = project.watchers?.some((watcher: any) => watcher.id === activityId);
    const _isStarred = project.stargizers?.some((stargizer: any) => stargizer.id === activityId);
    const _isOwner = project.activityId === activityId;

    return {
        ...project,
        _isWatching,
        _isStarred,
        _isOwner,
    };
};

export const project = router({
    suggestions: protectedProcedure.input(projectSuggestionsSchema).query(({ input: { query, take = 5, include } }) => {
        const includeInput = {
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
        };

        const where: Prisma.ProjectWhereInput = {
            title: {
                contains: query,
                mode: 'insensitive',
            },
        };

        if (include) {
            where.id = {
                notIn: include,
            };
        }

        const requests = [
            prisma.project.findMany({
                take,
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                    ...(include
                        ? {
                              id: {
                                  notIn: include,
                              },
                          }
                        : {}),
                },
                include: includeInput,
            }),
        ];

        if (include) {
            requests.push(
                prisma.project.findMany({
                    where: {
                        id: {
                            in: include,
                        },
                    },
                    include: includeInput,
                }),
            );
        }

        return Promise.all(requests).then(([suggest, included = []]) => [...included, ...suggest]);
    }),
    getAll: protectedProcedure
        .input(
            z
                .object({
                    firstLevel: z.boolean().optional(),
                    goalsQuery: queryWithFiltersSchema.optional(),
                })
                .optional(),
        )
        .query(async ({ ctx, input: { firstLevel, goalsQuery } = {} }) => {
            let result = [];
            // const hasQueries = Object.values(goalsQuery || {}).some((i) =>
            //     typeof i === 'object' ? Object.keys(i).length : !!i && i.toString().length,
            // );

            // if (!hasQueries) {
            const [projects, watchers, stargizers] = await Promise.all([
                prisma.$queryRaw`
                        select
                            p.id,
                            p.title,
                            p.description,
                            p."flowId",
                            p."createdAt",
                            p."updatedAt",
                            p."activityId",
                            count(g) as "goalsCount"
                        from "Project" as p
                        left join "Goal" as g on p.id = g."projectId"
                        group by p.id
                        order by max(g."updatedAt") desc
            ` as Promise<NonNullable<(Project & { goalsCount: number })[]>>,
                prisma.$queryRaw`
                        select pw."A" as id, pw."B" as "projectId"
                        from "_projectWatchers" as pw
                        where pw."A" in (${ctx.session.user.activityId})
            ` as Promise<{ id: string; projectId: string }[]>,
                prisma.$queryRaw`
                        select ps."A" as id, ps."B" as "projectId"
                        from "_projectStargizers" as ps
                        where ps."A" in (${ctx.session.user.activityId})
            ` as Promise<{ id: string; projectId: string }[]>,
            ]);

            const activities = (
                (await prisma.$queryRaw`
                select *
                from "Activity" as a
                left join "User" as u on u."activityId" = a.id
            `) as NonNullable<(Activity & { activityId: string; user: User })[]>
            ).reduce((acc, { ghostId, settingsId, createdAt, updatedAt, ...rest }) => {
                acc[rest.activityId] = {
                    id: rest.activityId,
                    createdAt,
                    ghostId,
                    settingsId,
                    updatedAt,
                    user: rest as unknown as User,
                };
                return acc;
            }, {} as Record<string, NonNullable<Activity & { user: User }>>);

            const projectsDict = projects.reduce((acc, { goalsCount, ...project }) => {
                acc[project.id] = {
                    ...project,
                    watchers: [],
                    stargizers: [],
                    parent: [],
                    tags: [],
                    children: [],
                    participants: [],
                    activity: activities[project.activityId],
                    _count: {
                        watchers: 0,
                        stargizers: 0,
                        goals: Number(goalsCount),
                        participants: 0,
                        children: 0,
                        parent: 0,
                    },
                };
                return acc;
            }, {} as Record<string, any>);

            for (let i = 0; i < Math.max(watchers.length, stargizers.length); i++) {
                const watcher = watchers[i];
                const stargizer = stargizers[i];

                if (watcher && watcher.projectId in projectsDict) {
                    const cur = projectsDict[watcher.projectId];
                    cur.watchers.push(watcher);
                    cur._count = { ...cur._count, watchers: (cur._count.watchers += 1) };
                }

                if (stargizer && stargizer.projectId in projectsDict) {
                    const cur = projectsDict[stargizer.projectId];
                    cur.stargizers.push(stargizer);
                    cur._count = { ...cur._count, stargizers: (cur._count.stargizers += 1) };
                }
            }

            result = Object.values(projectsDict);
            // } else {
            //     result = await prisma.project.findMany({
            //         ...getProjectSchema({
            //             activityId: ctx.session.user.activityId,
            //             goalsQuery,
            //             firstLevel,
            //         }),
            //     });
            // }

            return result?.map((project) => addCalculatedProjectFields(project, ctx.session.user.activityId));
        }),

    // .query(
    //     ({ ctx, input: { firstLevel, goalsQuery } = {} }) =>
    //     prisma.project.findMany({
    // ...getProjectSchema({
    //     activityId: ctx.session.user.activityId,
    //     goalsQuery,
    //     firstLevel,
    // }),
    // })
    // .then((res) => res.map((project) => addCalculatedProjectFields(project, ctx.session.user.activityId));
    // }),
    // ),

    getTop: protectedProcedure
        .input(
            z
                .object({
                    firstLevel: z.boolean().optional(),
                    goalsQuery: queryWithFiltersSchema.optional(),
                })
                .optional(),
        )
        .query(async ({ ctx, input: { firstLevel, goalsQuery } = {} }) => {
            const allProjects = await prisma.project
                .findMany({
                    orderBy: {
                        createdAt: 'asc',
                    },
                    ...getProjectSchema({
                        activityId: ctx.session.user.activityId,
                        goalsQuery,
                        firstLevel,
                    }),
                })
                .then((res) => res.map((project) => addCalculatedProjectFields(project, ctx.session.user.activityId)));

            // FIX: it is hack!
            return allProjects.filter((p) => p._count.parent === 0);
        }),
    getById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input: { id, goalsQuery } }) => {
            const project = await prisma.project.findUnique({
                ...getProjectSchema({
                    activityId: ctx.session.user.activityId,
                    goalsQuery,
                }),
                where: {
                    id,
                },
            });

            if (!project) return null;

            return addCalculatedProjectFields(project, ctx.session.user.activityId);
        }),
    getByIds: protectedProcedure
        .input(
            z.object({
                ids: z.array(z.string()),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input: { ids, goalsQuery } }) => {
            const projects = await prisma.project.findMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
                ...getProjectSchema({
                    activityId: ctx.session.user.activityId,
                    goalsQuery,
                }),
            });

            return projects.map((project) => addCalculatedProjectFields(project, ctx.session.user.activityId));
        }),
    getDeepInfo: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema,
            }),
        )
        .query(async ({ ctx, input: { id, goalsQuery } }) => {
            const [allProjectGoals, filtredProjectGoals] = await Promise.all([
                prisma.goal.findMany({
                    ...goalsFilter(
                        {
                            priority: [],
                            state: [],
                            tag: [],
                            estimate: [],
                            owner: [],
                            project: [],
                            query: '',
                        },
                        ctx.session.user.activityId,
                        { projectId: id },
                    ),
                    include: {
                        ...goalDeepQuery,
                        estimate: {
                            include: {
                                estimate: true,
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                }),
                prisma.goal.findMany({
                    ...goalsFilter(goalsQuery, ctx.session.user.activityId, { projectId: id }),
                    include: {
                        ...goalDeepQuery,
                        estimate: {
                            include: {
                                estimate: true,
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                }),
            ]);

            return {
                goals: filtredProjectGoals.map((g) => ({
                    ...g,
                    project: g.project ? addCalculatedProjectFields(g.project, ctx.session.user.activityId) : null,
                    ...addCalclulatedGoalsFields(g, ctx.session.user.activityId),
                    estimate: getEstimateListFormJoin(g),
                })),
                meta: calcGoalsMeta(allProjectGoals),
            };
        }),
    create: protectedProcedure
        .input(projectCreateSchema)
        .mutation(async ({ ctx, input: { id, title, description, flow } }) => {
            try {
                return prisma.project.create({
                    data: {
                        id,
                        title,
                        description,
                        activityId: ctx.session.user.activityId,
                        flowId: flow.id,
                        watchers: {
                            connect: [ctx.session.user.activityId].map((id) => ({ id })),
                        },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" < ${ process.env.MAIL_USER }> `,
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post < b > ${ title } </>`,
                // });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    update: protectedProcedure.input(projectUpdateSchema).mutation(async ({ input: { id, parent, ...data } }) => {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                parent: true,
            },
        });

        if (!project) return null;

        // TODO: support children

        const parentsToConnect = parent?.filter((pr) => !project.parent.some((p) => p.id === pr.id));
        const parentsToDisconnect = project.parent.filter((p) => !parent?.some((pr) => p.id === pr.id));

        try {
            return prisma.project.update({
                where: { id },
                data: {
                    ...data,
                    parent: {
                        connect: parentsToConnect?.map((p) => ({ id: p.id })) || [],
                        disconnect: parentsToDisconnect?.map((p) => ({ id: p.id })),
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
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    delete: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
        try {
            return prisma.project.delete({
                where: {
                    id,
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    toggleStargizer: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .mutation(({ ctx, input: { id, direction } }) => {
            const connection = { id };

            try {
                return prisma.activity.update({
                    where: { id: ctx.session.user.activityId },
                    data: {
                        projectStargizers: { [connectionMap[String(direction)]]: connection },
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    toggleWatcher: protectedProcedure.input(ToggleSubscriptionSchema).mutation(({ ctx, input: { id, direction } }) => {
        const connection = { id };

        try {
            return prisma.activity.update({
                where: { id: ctx.session.user.activityId },
                data: {
                    projectWatchers: { [connectionMap[String(direction)]]: connection },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    transferOwnership: protectedProcedure
        .input(projectTransferOwnershipSchema)
        .mutation(({ input: { id, activityId } }) => {
            try {
                return prisma.project.update({
                    where: { id },
                    data: {
                        activityId,
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
});
