import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import {
    projectCreateSchema,
    projectDeepInfoSchema,
    projectTransferOwnershipSchema,
    projectUpdateSchema,
} from '../../src/schema/project';
import {
    addCalclulatedGoalsFields,
    calcGoalsMeta,
    getEstimateListFormJoin,
    goalDeepQuery,
    goalsFilter,
} from '../queries/goals';
import { ToggleSubscriptionSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';

export const project = router({
    suggestions: protectedProcedure.input(z.string()).query(({ input }) => {
        return prisma.project.findMany({
            where: {
                title: {
                    contains: input,
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
    }),
    getAll: protectedProcedure.query(() => {
        return prisma.project.findMany({
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
    }),
    getTop: protectedProcedure.query(async () => {
        const allProjects = await prisma.project.findMany({
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
                children: true,
                parent: true,
                _count: {
                    select: {
                        parent: true,
                    },
                },
            },
        });

        // FIX: it is hack!
        return allProjects.filter((p) => p._count.parent === 0);
    }),
    getById: protectedProcedure.input(z.string()).query(async ({ ctx, input: id }) => {
        const project = await prisma.project.findUnique({
            where: {
                id,
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
            _isStarred:
                project.stargizers.filter((stargizer) => stargizer?.id === ctx.session.user.activityId).length > 0,
            _isWatching: project.watchers.filter((watcher) => watcher?.id === ctx.session.user.activityId).length > 0,
            _isOwner: project.activityId === ctx.session.user.activityId,
        };
    }),
    getDeepInfo: protectedProcedure.input(projectDeepInfoSchema).query(async ({ ctx, input }) => {
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
                    {
                        AND: {
                            OR: [
                                {
                                    projectId: input.id,
                                },
                                {
                                    project: {
                                        parent: {
                                            some: {
                                                id: input.id,
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
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
                ...goalsFilter(input, ctx.session.user.activityId, {
                    AND: {
                        OR: [
                            {
                                projectId: input.id,
                            },
                            {
                                project: {
                                    parent: {
                                        some: {
                                            id: input.id,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                }),
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
