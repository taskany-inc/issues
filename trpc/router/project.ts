import { Prisma, Role } from '@prisma/client';
import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import {
    projectCreateSchema,
    projectTransferOwnershipSchema,
    projectUpdateSchema,
    projectSuggestionsSchema,
    projectDeleteSchema,
} from '../../src/schema/project';
import { addCalclulatedGoalsFields, calcGoalsMeta, goalDeepQuery, goalsFilter } from '../queries/goals';
import { ToggleSubscriptionSchema, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { getProjectSchema, nonArchivedPartialQuery } from '../queries/project';
import { createEmailJob } from '../../src/utils/worker/create';
import { FieldDiff } from '../../src/types/common';
import { updateLinkedGoalsByProject } from '../../src/utils/db';

type WithId = { id: string };

export const addCalculatedProjectFields = <
    T extends { watchers?: WithId[]; stargizers?: WithId[]; activityId?: string },
>(
    project: T,
    activityId: string,
    role: Role,
): T & {
    _isWatching?: boolean;
    _isStarred?: boolean;
    _isOwner: boolean;
} => {
    const _isWatching = project.watchers?.some((watcher: any) => watcher.id === activityId);
    const _isStarred = project.stargizers?.some((stargizer: any) => stargizer.id === activityId);
    const _isOwner = project.activityId === activityId || role === 'ADMIN';

    return {
        ...project,
        _isWatching,
        _isStarred,
        _isOwner,
    };
};

export const project = router({
    suggestions: protectedProcedure
        .input(projectSuggestionsSchema)
        .query(async ({ input: { query, take = 5, include } }) => {
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
                        ...nonArchivedPartialQuery,
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
                            ...nonArchivedPartialQuery,
                        },
                        include: includeInput,
                    }),
                );
            }

            return Promise.all(requests).then(([suggest, included = []]) => [...included, ...suggest]);
        }),
    getUserProjectsWithGoals: protectedProcedure.input(queryWithFiltersSchema).query(async ({ ctx, input = {} }) => {
        const { activityId, role } = ctx.session.user;

        const projectsSchema = getProjectSchema({
            activityId,
            goalsQuery: input,
        });

        const requestSchema = ({ withOwner }: { withOwner: boolean }) => {
            return [
                {
                    // all projects / goals where the user is a participant
                    participants: {
                        some: {
                            id: activityId,
                        },
                    },
                },
                {
                    // all projects / goals where the user is a watcher
                    watchers: {
                        some: {
                            id: activityId,
                        },
                    },
                },
                {
                    stargizers: {
                        some: {
                            id: activityId,
                        },
                    },
                },
                {
                    // all projects / goals where the user is issuer
                    activityId,
                },
                withOwner
                    ? {
                          // all goals where the user is owner
                          ownerId: activityId,
                      }
                    : {},
            ];
        };

        const requestSchemaWithoutOwner = requestSchema({ withOwner: false });
        const projectIds = await prisma.project.findMany({
            where: {
                OR: [
                    ...requestSchemaWithoutOwner,
                    {
                        parent: {
                            some: {
                                OR: requestSchemaWithoutOwner,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
            },
        });
        const projectIdsArray = projectIds.map(({ id }) => id);

        const res = await prisma.project
            .findMany({
                orderBy: {
                    updatedAt: 'desc',
                },
                include: {
                    ...projectsSchema.include,
                    goals: {
                        //  all goals with filters
                        where: {
                            AND: [
                                input ? { ...goalsFilter(input, activityId).where } : {},
                                {
                                    OR: [
                                        ...requestSchema({ withOwner: true }),
                                        {
                                            projectId: {
                                                in: projectIdsArray,
                                            },
                                        },
                                    ],
                                },
                                nonArchivedPartialQuery,
                            ],
                        },
                        include: goalDeepQuery,
                    },
                    _count: {
                        select: {
                            // all goals without filters to count the total goals
                            goals: {
                                where: nonArchivedPartialQuery,
                            },
                        },
                    },
                },
                where: {
                    // all projects where the user is a participant / watcher / issuer / stargizer
                    OR: [
                        {
                            id: {
                                in: projectIdsArray,
                            },
                            AND: nonArchivedPartialQuery,
                        },
                        {
                            goals: {
                                some: {
                                    AND: [
                                        {
                                            OR: requestSchema({ withOwner: true }),
                                        },
                                        nonArchivedPartialQuery,
                                    ],
                                },
                            },
                        },
                    ],
                },
            })
            .then((res) => ({
                groups: res.map((project) => {
                    const goals = project.goals.map((goal) => {
                        return {
                            ...goal,
                            ...addCalclulatedGoalsFields(goal, activityId, role),
                        };
                    });

                    const { goals: _, _count, ...rest } = project;

                    return {
                        goals,
                        project: addCalculatedProjectFields(rest, activityId, role),
                    };
                }),
                totalGoalsCount: res.reduce((acc, cur) => {
                    acc += cur._count.goals;
                    return acc;
                }, 0),
            }));

        return res;
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
            const { activityId, role } = ctx.session.user;

            if (goalsQuery && goalsQuery.stateType) {
                goalsQuery.state = goalsQuery.state ?? [];

                const stateByTypes = await prisma.state.findMany({
                    where: {
                        type: {
                            in: goalsQuery.stateType,
                        },
                    },
                });

                stateByTypes.forEach((state) => {
                    if (goalsQuery.state?.includes(state.id)) {
                        return;
                    }

                    goalsQuery.state?.push(state.id);
                });
            }

            const projects = await prisma.project
                .findMany({
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    ...getProjectSchema({
                        activityId,
                        goalsQuery,
                        firstLevel,
                        whereQuery: {
                            goals: {
                                some: goalsQuery ? goalsFilter(goalsQuery, activityId).where : {},
                            },
                        },
                    }),
                })
                .then((res) => res.map((project) => addCalculatedProjectFields(project, activityId, role)));

            return projects;
        }),
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
            const { activityId, role } = ctx.session.user;

            const allProjects = await prisma.project
                .findMany({
                    orderBy: {
                        createdAt: 'asc',
                    },
                    ...getProjectSchema({
                        activityId,
                        goalsQuery,
                        firstLevel,
                    }),
                })
                .then((res) => res.map((project) => addCalculatedProjectFields(project, activityId, role)));

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
            const { activityId, role } = ctx.session.user;

            const project = await prisma.project.findUnique({
                ...getProjectSchema({
                    activityId,
                    goalsQuery,
                }),
                where: {
                    id,
                },
            });

            if (!project) return null;

            return addCalculatedProjectFields(project, activityId, role);
        }),
    getByIds: protectedProcedure
        .input(
            z.object({
                ids: z.array(z.string()),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input: { ids, goalsQuery } }) => {
            const { activityId, role } = ctx.session.user;

            const projects = await prisma.project.findMany({
                ...getProjectSchema({
                    activityId,
                    goalsQuery,
                    whereQuery: {
                        id: {
                            in: ids,
                        },
                    },
                }),
            });

            return projects.map((project) => addCalculatedProjectFields(project, activityId, role));
        }),
    getDeepInfo: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema,
            }),
        )
        .query(async ({ ctx, input: { id, goalsQuery } }) => {
            const { activityId, role } = ctx.session.user;

            const [allProjectGoals, filtredProjectGoals] = await Promise.all([
                prisma.goal.findMany({
                    ...goalsFilter(
                        {
                            priority: [],
                            state: [],
                            stateType: [],
                            tag: [],
                            estimate: [],
                            owner: [],
                            project: [],
                            query: '',
                        },
                        activityId,
                        { projectId: id },
                    ),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
                prisma.goal.findMany({
                    ...goalsFilter(goalsQuery, activityId, { projectId: id }),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
            ]);

            return {
                goals: filtredProjectGoals.map((g) => ({
                    ...g,
                    _project: g.project ? addCalculatedProjectFields(g.project, activityId, role) : null,
                    ...addCalclulatedGoalsFields(g, activityId, role),
                })),
                meta: calcGoalsMeta(allProjectGoals),
            };
        }),
    create: protectedProcedure
        .input(projectCreateSchema)
        .mutation(async ({ ctx, input: { id, title, description, flow } }) => {
            const { activityId } = ctx.session.user;

            try {
                return prisma.project.create({
                    data: {
                        id,
                        title,
                        description,
                        activityId,
                        flowId: flow.id,
                        watchers: {
                            connect: [activityId].map((id) => ({ id })),
                        },
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    update: protectedProcedure.input(projectUpdateSchema).mutation(async ({ input: { id, parent, ...data }, ctx }) => {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                parent: true,
                activity: { include: { user: true, ghost: true } },
                participants: { include: { user: true, ghost: true } },
                watchers: { include: { user: true, ghost: true } },
            },
        });

        if (!project) return null;

        // TODO: support children

        const parentsToConnect = parent?.filter((pr) => !project.parent.some((p) => p.id === pr.id));
        const parentsToDisconnect = project.parent.filter((p) => !parent?.some((pr) => p.id === pr.id));

        try {
            const updatedProject = await prisma.project.update({
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

            if (parentsToConnect) {
                const newParents = await prisma.project.findMany({
                    where: {
                        id: {
                            in: parentsToConnect?.map(({ id }) => id),
                        },
                        AND: nonArchivedPartialQuery,
                    },
                    include: {
                        activity: { include: { user: true, ghost: true } },
                        participants: { include: { user: true, ghost: true } },
                        watchers: { include: { user: true, ghost: true } },
                    },
                });

                await Promise.all(
                    newParents.map((parent) => {
                        const recipients = Array.from(
                            new Set(
                                [parent.activity, ...parent.participants, ...parent.watchers]
                                    .filter(Boolean)
                                    .filter((p) => p.user?.email !== ctx.session.user.email)
                                    .map((r) => r.user?.email),
                            ),
                        );

                        return recipients.length
                            ? createEmailJob('childProjectCreated', {
                                  to: recipients,
                                  childKey: updatedProject.id,
                                  childTitle: updatedProject.title,
                                  projectKey: parent.id,
                                  projectTitle: parent.title,
                                  author: ctx.session.user.name || ctx.session.user.email,
                              })
                            : null;
                    }),
                );
            }

            if (parentsToDisconnect) {
                const oldParents = await prisma.project.findMany({
                    where: {
                        id: {
                            in: parentsToDisconnect?.map(({ id }) => id),
                        },
                        AND: nonArchivedPartialQuery,
                    },
                    include: {
                        activity: { include: { user: true, ghost: true } },
                        participants: { include: { user: true, ghost: true } },
                        watchers: { include: { user: true, ghost: true } },
                    },
                });

                await Promise.all(
                    oldParents.map((parent) => {
                        const recipients = Array.from(
                            new Set(
                                [parent.activity, ...parent.participants, ...parent.watchers]
                                    .filter(Boolean)
                                    .filter((p) => p.user?.email !== ctx.session.user.email)
                                    .map((r) => r.user?.email),
                            ),
                        );

                        return recipients.length
                            ? createEmailJob('childProjectDeleted', {
                                  to: recipients,
                                  childKey: updatedProject.id,
                                  childTitle: updatedProject.title,
                                  projectKey: parent.id,
                                  projectTitle: parent.title,
                                  author: ctx.session.user.name || ctx.session.user.email,
                              })
                            : null;
                    }),
                );
            }

            const updatedFields: {
                title?: FieldDiff;
                description?: FieldDiff;
            } = {};

            if (updatedProject.title !== project.title) {
                updatedFields.title = [project.title, updatedProject.title];
            }

            if (updatedProject.description !== project.description) {
                updatedFields.description = [project.description, updatedProject.description];
            }

            const recipients = Array.from(
                new Set(
                    [...project.participants, ...project.watchers, project.activity]
                        .filter(Boolean)
                        .filter((p) => p.user?.email !== ctx.session.user.email)
                        .map((r) => r.user?.email),
                ),
            );

            if (recipients.length) {
                await createEmailJob('projectUpdated', {
                    to: recipients,
                    key: project.id,
                    title: project.title,
                    updatedFields,
                    author: ctx.session.user.name || ctx.session.user.email,
                });
            }

            return updatedProject;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    delete: protectedProcedure.input(projectDeleteSchema).mutation(async ({ input, ctx }) => {
        try {
            const currentProject = await prisma.project.findUnique({
                where: {
                    id: input.id,
                },
                include: {
                    parent: true,
                },
            });

            if (!currentProject || currentProject.archived) {
                return;
            }

            // before update project need to update project goals
            await updateLinkedGoalsByProject(input.id, ctx.session.user.activityId);

            return prisma.project.update({
                where: {
                    id: input.id,
                },
                data: {
                    archived: true,
                    parent: {
                        disconnect: currentProject.parent.map(({ id }) => ({ id })),
                    },
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
        .mutation(async ({ input: { id, activityId }, ctx }) => {
            const [project, newOwner] = await Promise.all([
                prisma.project.findUnique({
                    where: { id },
                }),
                prisma.activity.findUnique({
                    where: { id: activityId },
                    include: {
                        user: true,
                        ghost: true,
                    },
                }),
            ]);

            if (!project) {
                return null;
            }

            if (!newOwner) {
                return null;
            }

            try {
                const transferedProject = await prisma.project.update({
                    where: { id },
                    data: {
                        activityId,
                    },
                });

                await createEmailJob('projectTransfered', {
                    to: [newOwner.user?.email],
                    key: project.id,
                    title: project.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                });

                return transferedProject;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
});
