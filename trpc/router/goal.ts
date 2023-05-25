import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { addCalclulatedGoalsFields, calcGoalsMeta, goalDeepQuery, goalsFilter } from '../queries/goals';
import {
    goalChangeProjectSchema,
    goalCommonSchema,
    goalParticipantsSchema,
    goalStateChangeSchema,
    goalUpdateSchema,
    toogleGoalArchiveSchema,
    toogleGoalDependencySchema,
    userGoalsSchema,
} from '../../src/schema/goal';
import { ToggleSubscriptionSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { createGoal, changeGoalProject } from '../../src/utils/db';

export const goal = router({
    suggestions: protectedProcedure.input(z.string()).query(async ({ input }) => {
        const splittedInput = input.split('-');
        let selectParams = {};

        if (splittedInput.length === 2 && Number.isNaN(+splittedInput[1])) {
            selectParams = {
                AND: [
                    {
                        projectId: {
                            contains: splittedInput[0],
                            mode: 'insensitive',
                        },
                    },
                    {
                        scopeId: {
                            contains: splittedInput[1],
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        return prisma.goal.findMany({
            take: 10,
            where: {
                OR: [
                    selectParams,
                    {
                        title: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                ],
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
                project: {
                    include: {
                        flow: true,
                    },
                },
                reactions: {
                    include: {
                        activity: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                    },
                },
                estimate: true,
                watchers: true,
                stargizers: true,
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
                comments: {
                    include: {
                        activity: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                        reactions: true,
                    },
                },
                participants: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
        });
    }),
    getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        // try to recognize shot id like: FRNTND-23
        const [projectId, scopeIdStr] = input.split('-');

        if (!projectId) return null;

        const scopeId = parseInt(scopeIdStr, 10);

        if (!scopeId) return null;

        try {
            const goal = await prisma.goal.findFirst({
                where: {
                    projectId,
                    scopeId,
                    archived: false,
                },
                include: {
                    ...goalDeepQuery,
                },
            });

            if (!goal) return null;

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, ctx.session.user.activityId),
            };
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    getUserGoals: protectedProcedure.input(userGoalsSchema).query(async ({ ctx, input }) => {
        const { activityId } = ctx.session.user;

        const userDashboardGoals = {
            AND: {
                OR: [
                    // all projects where the user is a participant
                    {
                        project: {
                            participants: {
                                some: {
                                    id: activityId,
                                },
                            },
                        },
                    },
                    // all projects where the user is a watcher
                    {
                        project: {
                            watchers: {
                                some: {
                                    id: activityId,
                                },
                            },
                        },
                    },
                    // all projects where the user is owner
                    {
                        project: {
                            activityId,
                        },
                    },
                    // all goals where the user is a participant
                    {
                        participants: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all goals where the user is a watcher
                    {
                        watchers: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all goals where the user is issuer
                    {
                        activityId,
                    },
                    // all goals where the user is owner
                    {
                        ownerId: activityId,
                    },
                ],
            },
        };

        const [allUserGoals, filtredUserGoals] = await Promise.all([
            prisma.goal.findMany({
                ...goalsFilter(
                    {
                        priority: [],
                        state: [],
                        tag: [],
                        estimate: [],
                        owner: [],
                        project: [],
                        sort: {},
                        query: '',
                    },
                    {
                        ...userDashboardGoals,
                    },
                ),
                include: {
                    ...goalDeepQuery,
                },
            }),
            prisma.goal.findMany({
                ...goalsFilter(input, {
                    ...userDashboardGoals,
                }),
                include: {
                    ...goalDeepQuery,
                },
            }),
        ]);

        return {
            goals: filtredUserGoals.map((g) => ({
                ...g,
                ...addCalclulatedGoalsFields(g, ctx.session.user.activityId),
            })),
            meta: calcGoalsMeta(allUserGoals),
        };
    }),
    create: protectedProcedure.input(goalCommonSchema).mutation(async ({ ctx, input }) => {
        if (!input.owner.id) return null;
        if (!input.parent.id) return null;

        const { activityId } = ctx.session.user;

        try {
            return createGoal(activityId, input);

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
    changeProject: protectedProcedure.input(goalChangeProjectSchema).mutation(async ({ input }) => {
        return changeGoalProject(input.id, input.projectId);
    }),
    update: protectedProcedure.input(goalUpdateSchema).mutation(async ({ ctx, input }) => {
        const actualGoal = await prisma.goal.findUnique({
            where: { id: input.id },
            include: { participants: true, project: true, tags: true },
        });

        if (!actualGoal) return null;

        // FIXME: move out to separated mutations
        let participantsToDisconnect: Array<{ id: string }> = [];
        let tagsToDisconnect: Array<{ id: string }> = [];

        if (input.participants?.length) {
            participantsToDisconnect =
                actualGoal.participants?.filter((p) => !input.participants?.some((pa) => pa.id === p.id)) || [];
        }

        if (input.tags?.length) {
            tagsToDisconnect = actualGoal.tags?.filter((t) => !input.tags?.some((tag) => tag.id === t.id)) || [];
        }

        try {
            return prisma.goal.update({
                where: { id: actualGoal.id },
                data: {
                    ownerId: input.owner?.id,
                    projectId: input.parent?.id,
                    title: input.title,
                    description: input.description,
                    stateId: input.state?.id,
                    priority: input.priority,
                    // FIXME: looks like we are creating new every update
                    estimate: input.estimate
                        ? {
                              create: {
                                  ...input.estimate,
                                  activityId: ctx.session.user.activityId,
                              },
                          }
                        : undefined,
                    tags: input.tags?.length
                        ? {
                              connect: input.tags.map((t) => ({ id: t.id })),
                              disconnect: tagsToDisconnect,
                          }
                        : undefined,
                    participants: input.participants?.length
                        ? {
                              connect: input.participants.map((p) => ({ id: p.id })),
                              disconnect: participantsToDisconnect,
                          }
                        : undefined,
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
    toggleStargizer: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .mutation(({ ctx, input: { id, direction } }) => {
            const connection = { id };

            try {
                return prisma.activity.update({
                    where: { id: ctx.session.user.activityId },
                    data: {
                        goalStargizers: { [connectionMap[String(direction)]]: connection },
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
                    goalWatchers: { [connectionMap[String(direction)]]: connection },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    toggleDependency: protectedProcedure
        .input(toogleGoalDependencySchema)
        .mutation(({ input: { id, target, direction, kind }, ctx }) => {
            const connection = { id: target };

            try {
                return prisma.goal.update({
                    where: { id },
                    data: {
                        id, // this is hack to force updatedAt field
                        [kind]: { [connectionMap[String(direction)]]: connection },
                        history: {
                            create: {
                                activityId: ctx.session.user.activityId,
                                subject: 'dependencies',
                                action: direction ? 'add' : 'remove',
                                // FIXME: scoped id of deps goal
                                nextValue: target,
                            },
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
    toggleArchive: protectedProcedure.input(toogleGoalArchiveSchema).mutation(({ input: { id, archived }, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id },
                data: {
                    archived,
                    history: {
                        create: {
                            subject: 'state',
                            action: 'archive',
                            activityId: ctx.session.user.activityId,
                            nextValue: archived ? 'move to archive' : 'move from archive',
                        },
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

    toggleParticipants: protectedProcedure.input(goalParticipantsSchema).mutation(async ({ input, ctx }) => {
        const [projectId, scopeIdStr] = input.id.split('-');

        if (!projectId) return null;

        const scopeId = parseInt(scopeIdStr, 10);

        if (!scopeId) return null;

        const actualGoal = await prisma.goal.findFirst({
            where: { projectId, scopeId },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!actualGoal) {
            return null;
        }

        const participantsToDisconnect = actualGoal.participants
            .filter((p) => !input.participants?.some((pa) => pa.id === p.id))
            .map(({ id }) => ({ id }));

        const hash = new Set(
            actualGoal.participants.map(({ id }) => id).concat(input.participants.map(({ id }) => id)),
        );

        const simpliestList = actualGoal.participants.reduce<typeof input.participants>((acc, { id, user }) => {
            if (user) {
                acc.push({
                    id,
                    name: user.nickname ?? user.name ?? user.email,
                });
            }

            return acc;
        }, []);

        const shortList = participantsToDisconnect.length ? input.participants : simpliestList;
        const longList = participantsToDisconnect.length ? simpliestList : input.participants;
        const action = participantsToDisconnect.length ? 'remove' : 'add';

        for (const { id } of shortList) {
            hash.delete(id);
        }

        const [diffId] = Array.from(hash);

        try {
            return prisma.goal.update({
                where: {
                    id: actualGoal.id,
                },
                data: {
                    id: actualGoal.id,
                    participants: {
                        connect: input.participants.map(({ id }) => ({ id })),
                        disconnect: participantsToDisconnect,
                    },
                    history: {
                        create: {
                            subject: 'participants',
                            action,
                            nextValue: longList.find(({ id }) => id === diffId)!.name,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ message: String(error.message), code: 'INTERNAL_SERVER_ERROR', cause: error });
        }
    }),
    switchState: protectedProcedure.input(goalStateChangeSchema).mutation(async ({ input, ctx }) => {
        try {
            return await prisma.goal.update({
                where: {
                    id: input.id,
                },
                data: {
                    id: input.id,
                    stateId: input.state.id,
                    history: {
                        create: {
                            subject: 'state',
                            action: 'change',
                            previousValue: input.prevState.title,
                            nextValue: input.state.title,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
