import { Prisma } from '@prisma/client';
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
import { addCalculatedGoalsFields, goalDeepQuery, goalsFilter } from '../queries/goals';
import { ToggleSubscriptionSchema, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { addCalculatedProjectFields, getProjectSchema, nonArchivedPartialQuery } from '../queries/project';
import { createEmailJob } from '../../src/utils/worker/create';
import { FieldDiff } from '../../src/types/common';
import { updateLinkedGoalsByProject } from '../../src/utils/db';
import { projectAccessMiddleware } from '../access/accessMiddlewares';

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
    getUserProjectsWithGoals: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                cursor: z.string().nullish(),
                skip: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input = {} }) => {
            const { activityId, role } = ctx.session.user;
            const { limit = 10, cursor, skip, goalsQuery } = input;

            const projectsSchema = getProjectSchema({
                activityId,
                goalsQuery,
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
            const goalsFilters = goalsQuery ? { ...goalsFilter(goalsQuery, activityId).where } : {};

            const { groups, totalGoalsCount } = await prisma.project
                .findMany({
                    take: limit + 1,
                    skip,
                    cursor: cursor ? { id: cursor } : undefined,
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    include: {
                        ...projectsSchema.include,
                        goals: {
                            //  all goals with filters
                            where: {
                                AND: [
                                    goalsFilters,
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
                        sharedGoals: {
                            //  all shared goals with filters
                            where: {
                                AND: [
                                    goalsFilters,
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
                                // all shared goals without filters to count the total goals
                                sharedGoals: {
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
                                AND: [
                                    nonArchivedPartialQuery,
                                    goalsQuery
                                        ? {
                                              goals: {
                                                  some: {
                                                      AND: goalsFilters,
                                                  },
                                              },
                                          }
                                        : {},
                                ],
                            },
                            {
                                goals: {
                                    some: {
                                        AND: [
                                            {
                                                OR: requestSchema({ withOwner: true }),
                                            },
                                            goalsFilters,
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
                                ...addCalculatedGoalsFields(goal, activityId, role),
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

            let nextCursor: typeof cursor | undefined;

            if (groups.length > limit) {
                const nextItem = groups.pop();
                nextCursor = nextItem?.project.id;
            }

            return { groups, nextCursor, totalGoalsCount };
        }),
    getAll: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().nullish(),
                    skip: z.number().optional(),
                    firstLevel: z.boolean().optional(),
                    goalsQuery: queryWithFiltersSchema.optional(),
                })
                .optional(),
        )
        .query(async ({ ctx, input: { cursor, skip, limit, firstLevel, goalsQuery } = {} }) => {
            const { activityId, role } = ctx.session.user;

            if (goalsQuery && goalsQuery.stateType) {
                const stateByTypes = await prisma.state.findMany({
                    where: {
                        type: {
                            in: goalsQuery.stateType,
                        },
                    },
                });
                stateByTypes.forEach((state) => {
                    if (!goalsQuery.state) {
                        goalsQuery.state = [];
                    }
                    if (!goalsQuery.state.includes(state.id)) {
                        goalsQuery.state.push(state.id);
                    }
                });
            }

            const projectPagination = limit
                ? { take: limit + 1, skip, cursor: cursor ? { id: cursor } : undefined }
                : undefined;

            const projects = await prisma.project
                .findMany({
                    ...projectPagination,
                    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
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

            let nextCursor: typeof cursor | undefined;

            if (limit && projects.length > limit) {
                const nextItem = projects.pop();
                nextCursor = nextItem?.id;
            }

            return { projects, nextCursor };
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
                        AND: [
                            {
                                id: {
                                    in: ids,
                                },
                            },
                            goalsQuery
                                ? {
                                      goals: {
                                          some: goalsFilter(goalsQuery, activityId).where,
                                      },
                                  }
                                : {},
                        ],
                    },
                }),
            });

            return projects.map((project) => addCalculatedProjectFields(project, activityId, role));
        }),
    getDeepInfo: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input: { id, goalsQuery = {} } }) => {
            const { activityId, role } = ctx.session.user;

            const [allProjectGoals, filtredProjectGoals] = await Promise.all([
                prisma.goal.count({
                    where: {
                        projectId: id,
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
                    ...addCalculatedGoalsFields(g, activityId, role),
                })),
                meta: {
                    count: allProjectGoals,
                },
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
    update: protectedProcedure
        .input(projectUpdateSchema)
        .use(projectAccessMiddleware)
        .mutation(async ({ input: { id, parent, participants, ...data }, ctx }) => {
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

            const participantsToConnet = participants?.filter(
                (pr) => !project.participants.some((p) => p.id === pr.id),
            );
            const participantsToDisconnect = project.participants.filter(
                (p) => !participants?.some((pr) => p.id === pr.id),
            );

            try {
                const updatedProject = await prisma.project.update({
                    where: { id },
                    data: {
                        ...data,
                        participants: {
                            connect: participantsToConnet?.map((p) => ({ id: p.id })) || [],
                            disconnect: participantsToDisconnect.map((p) => ({ id: p.id })),
                        },
                        parent: {
                            connect: parentsToConnect?.map((p) => ({ id: p.id })) || [],
                            disconnect: parentsToDisconnect?.map((p) => ({ id: p.id })),
                        },
                    },
                    include: {
                        parent: true,
                        participants: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
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
                                        .map((r) => r.user?.email),
                                ),
                            );

                            return createEmailJob('childProjectCreated', {
                                to: recipients,
                                childKey: updatedProject.id,
                                childTitle: updatedProject.title,
                                projectKey: parent.id,
                                projectTitle: parent.title,
                                author: ctx.session.user.name || ctx.session.user.email,
                                authorEmail: ctx.session.user.email,
                            });
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
                                        .map((r) => r.user?.email),
                                ),
                            );

                            return createEmailJob('childProjectDeleted', {
                                to: recipients,
                                childKey: updatedProject.id,
                                childTitle: updatedProject.title,
                                projectKey: parent.id,
                                projectTitle: parent.title,
                                author: ctx.session.user.name || ctx.session.user.email,
                                authorEmail: ctx.session.user.email,
                            });
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
                            .map((r) => r.user?.email),
                    ),
                );

                await createEmailJob('projectUpdated', {
                    to: recipients,
                    key: project.id,
                    title: project.title,
                    updatedFields,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedProject;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    delete: protectedProcedure
        .input(projectDeleteSchema)
        .use(projectAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
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
        .use(projectAccessMiddleware)
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
                    authorEmail: ctx.session.user.email,
                });

                return transferedProject;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
});
