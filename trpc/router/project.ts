import { Activity, Ghost, User, StateType } from '@prisma/client';
import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import {
    projectCreateSchema,
    projectTransferOwnershipSchema,
    projectUpdateSchema,
    projectDeleteSchema,
    participantsToProjectSchema,
    teamsToProjectSchema,
} from '../../src/schema/project';
import { getGoalDeepQuery, goalsFilter, nonArchievedGoalsPartialQuery } from '../queries/goals';
import { ToggleSubscriptionSchema, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { addCalculatedProjectFields, getProjectSchema, nonArchivedPartialQuery } from '../queries/project';
import { createEmail } from '../../src/utils/createEmail';
import { FieldDiff } from '../../src/types/common';
import { updateLinkedGoalsByProject } from '../../src/utils/db';
import { prepareUserDataFromActivity } from '../../src/utils/getUserName';
import { projectAccessMiddleware, projectEditAccessMiddleware } from '../access/accessMiddlewares';
import { getProjectAccessFilter } from '../queries/access';
import { prepareRecipients } from '../../src/utils/prepareRecipients';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';

const getUserItemsWhereSchema = ({ type, activityId }: { type: 'goal' | 'project'; activityId: string }) => {
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
        type === 'goal'
            ? {
                  // all goals where the user is owner
                  ownerId: activityId,
              }
            : {},
    ];
};

export const project = router({
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

            const whereProjectsSchema = getUserItemsWhereSchema({ type: 'project', activityId });
            const whereGoalsSchema = getUserItemsWhereSchema({ type: 'goal', activityId });

            const accessFilter = getProjectAccessFilter(activityId, role);
            const projectIds = await prisma.project.findMany({
                where: {
                    OR: [
                        ...whereProjectsSchema,
                        {
                            parent: {
                                some: {
                                    OR: whereProjectsSchema,
                                },
                            },
                        },
                    ],
                    ...accessFilter,
                },
                select: {
                    id: true,
                },
            });
            const projectIdsArray = projectIds.map(({ id }) => id);
            const goalsFilters = goalsQuery ? { ...goalsFilter(goalsQuery, activityId, role) } : undefined;

            const { where: projectWhere } = getProjectSchema({
                role,
                activityId,
                goalsQuery,
                whereQuery: {
                    // all projects where the user is a participant / watcher / issuer / stargizer
                    OR: [
                        {
                            id: {
                                in: projectIdsArray,
                            },
                            AND: [
                                goalsFilters
                                    ? {
                                          goals: {
                                              some: {
                                                  AND: goalsFilters.where,
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
                                            OR: whereGoalsSchema,
                                        },
                                        goalsFilters ? goalsFilters.where : null,
                                        nonArchivedPartialQuery,
                                    ],
                                },
                            },
                        },
                    ],
                },
            });

            const goalsDeepIncludeSchema = getGoalDeepQuery({
                activityId,
                role,
            });

            const { groups, totalGoalsCount } = await prisma.project
                .findMany({
                    take: limit + 1,
                    skip,
                    cursor: cursor ? { id: cursor } : undefined,
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    include: {
                        children: {
                            include: {
                                parent: true,
                            },
                            where: accessFilter,
                        },
                        activity: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                        participants: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                        goals: {
                            //  all goals with filters
                            where: {
                                AND: [
                                    goalsFilters?.where ?? {},
                                    {
                                        OR: [
                                            ...whereGoalsSchema,
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
                            orderBy: goalsFilters?.orderBy,
                            include: {
                                tags: goalsDeepIncludeSchema.tags,
                                state: goalsDeepIncludeSchema.state,
                                owner: goalsDeepIncludeSchema.owner,
                                participants: goalsDeepIncludeSchema.participants,
                                priority: goalsDeepIncludeSchema.priority,
                                watchers: goalsDeepIncludeSchema.watchers,
                                stargizers: goalsDeepIncludeSchema.stargizers,
                                project: {
                                    include: {
                                        parent: true,
                                    },
                                },
                                _count: goalsDeepIncludeSchema._count,
                            },
                        },
                        _count: {
                            select: {
                                // all goals without filters to count the total goals
                                goals: {
                                    where: nonArchivedPartialQuery,
                                },
                                stargizers: true,
                                watchers: true,
                                participants: true,
                                children: {
                                    where: accessFilter,
                                },
                            },
                        },
                    },
                    where: projectWhere,
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
                            project: Object.assign(addCalculatedProjectFields(rest, activityId, role), {
                                _count,
                            }),
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
                    includePersonal: z.boolean().optional(),
                    goalsQuery: queryWithFiltersSchema.optional(),
                })
                .optional(),
        )
        .query(
            async ({ ctx, input: { cursor, skip, limit, firstLevel, goalsQuery, includePersonal = false } = {} }) => {
                const { activityId, role } = ctx.session.user;
                const projectIds = goalsQuery?.project ?? [];

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

                const whereQuery = {
                    personal: includePersonal ? {} : false,
                    id: projectIds.length
                        ? {
                              in: projectIds,
                          }
                        : {},
                    goals: goalsQuery ? { some: goalsFilter(goalsQuery, activityId, role).where } : {},
                };

                const projects = await prisma.project
                    .findMany({
                        ...projectPagination,
                        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
                        ...getProjectSchema({
                            role,
                            activityId,
                            goalsQuery,
                            firstLevel,
                            whereQuery,
                        }),
                    })
                    .then((res) => res.map((project) => addCalculatedProjectFields(project, activityId, role)));

                let nextCursor: typeof cursor | undefined;

                if (limit && projects.length > limit) {
                    const nextItem = projects.pop();
                    nextCursor = nextItem?.id;
                }

                return { projects, nextCursor };
            },
        ),
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

            return prisma.project
                .findMany({
                    orderBy: {
                        createdAt: 'asc',
                    },
                    ...getProjectSchema({
                        role,
                        activityId,
                        goalsQuery,
                        firstLevel,
                    }),
                })
                .then((res) => res.map((project) => addCalculatedProjectFields(project, activityId, role)));
        }),
    getById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .use(projectAccessMiddleware)
        .query(async ({ ctx, input: { id, goalsQuery } }) => {
            const { activityId, role } = ctx.session.user;

            const { include } = getProjectSchema({
                role,
                activityId,
                goalsQuery,
            });

            const project = await prisma.project.findUnique({
                include,
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
                    role,
                    activityId,
                    goalsQuery,
                    whereQuery: {
                        id: {
                            in: ids,
                        },
                        ...(goalsQuery
                            ? {
                                  OR: [
                                      {
                                          goals: {
                                              some: goalsFilter(goalsQuery, activityId, role).where,
                                          },
                                      },
                                      {
                                          goals: {
                                              none: goalsFilter(goalsQuery, activityId, role).where,
                                          },
                                          children: {
                                              some: {
                                                  goals: {
                                                      some: goalsFilter(goalsQuery, activityId, role).where,
                                                  },
                                              },
                                          },
                                      },
                                  ],
                              }
                            : {}),
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
        .use(projectAccessMiddleware)
        .query(async ({ ctx, input: { id, goalsQuery = {} } }) => {
            const { activityId, role } = ctx.session.user;
            const goalsWhere = {
                OR: [{ projectId: id }, { partnershipProjects: { some: { id } } }],
            };

            const [allProjectGoals, filtredProjectGoals] = await Promise.all([
                prisma.goal.count({
                    where: goalsWhere,
                }),
                prisma.goal.findMany({
                    ...goalsFilter(goalsQuery, activityId, role, goalsWhere),
                    include: getGoalDeepQuery({
                        activityId,
                        role,
                    }),
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
        .mutation(async ({ ctx, input: { id, title, description, flow, parent } }) => {
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
                        parent: {
                            connect: parent?.map(({ id }) => ({ id })),
                        },
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    update: protectedProcedure
        .input(projectUpdateSchema)
        .use(projectEditAccessMiddleware)
        .mutation(async ({ input: { id, parent, accessUsers, ...data }, ctx }) => {
            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    teams: true,
                    parent: true,
                    activity: { include: { user: true, ghost: true } },
                    participants: { include: { user: true, ghost: true } },
                    accessUsers: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                },
            });

            if (!project) return null;

            const parentsToConnect = parent?.filter((pr) => !project.parent.some((p) => p.id === pr.id));
            const parentsToDisconnect = project.parent.filter((p) => !parent?.some((pr) => p.id === pr.id));

            const accessUsersToConnect =
                accessUsers?.filter((pr) => !project.accessUsers.some((p) => p.id === pr.id)) ?? [];
            const accessUsersToDisconnect = project.accessUsers.filter(
                (p) => !accessUsers?.some((pr) => p.id === pr.id),
            );

            try {
                const updatedProject = await prisma.project.update({
                    where: { id },
                    data: {
                        ...data,
                        accessUsers: {
                            connect: accessUsersToConnect?.map((p) => ({ id: p.id })) || [],
                            disconnect: accessUsersToDisconnect.map((p) => ({ id: p.id })),
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
                        accessUsers: {
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
                            accessUsers: { include: { user: true, ghost: true } },
                            watchers: { include: { user: true, ghost: true } },
                        },
                    });

                    await Promise.all(
                        newParents.map((parent) => {
                            return prepareRecipients([
                                parent.activity,
                                ...parent.accessUsers,
                                ...parent.participants,
                                ...parent.watchers,
                            ]).then((recipients) =>
                                createEmail('childProjectCreated', {
                                    to: recipients,
                                    childKey: updatedProject.id,
                                    childTitle: updatedProject.title,
                                    projectKey: parent.id,
                                    projectTitle: parent.title,
                                    author: ctx.session.user.name || ctx.session.user.email,
                                    authorEmail: ctx.session.user.email,
                                }),
                            );
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
                            accessUsers: { include: { user: true, ghost: true } },
                            watchers: { include: { user: true, ghost: true } },
                        },
                    });

                    await Promise.all(
                        oldParents.map((parent) => {
                            return prepareRecipients([
                                parent.activity,
                                ...parent.accessUsers,
                                ...parent.participants,
                                ...parent.watchers,
                            ]).then((recipients) =>
                                createEmail('childProjectDeleted', {
                                    to: recipients,
                                    childKey: updatedProject.id,
                                    childTitle: updatedProject.title,
                                    projectKey: parent.id,
                                    projectTitle: parent.title,
                                    author: ctx.session.user.name || ctx.session.user.email,
                                    authorEmail: ctx.session.user.email,
                                }),
                            );
                        }),
                    );
                }

                const updatedFields: {
                    title?: FieldDiff;
                    description?: FieldDiff;
                    accessUsers?: FieldDiff;
                } = {};

                if (updatedProject.title !== project.title) {
                    updatedFields.title = [project.title, updatedProject.title];
                }

                if (updatedProject.description !== project.description) {
                    updatedFields.description = [project.description, updatedProject.description];
                }

                if (accessUsersToConnect.length || accessUsersToDisconnect.length) {
                    const participantsToString = <T extends Activity & { user: User | null; ghost: Ghost | null }>(
                        accessUsers: T[],
                    ) => accessUsers.map((participant) => prepareUserDataFromActivity(participant)?.email).join(', ');

                    updatedFields.accessUsers = [
                        participantsToString(project.accessUsers),
                        participantsToString(updatedProject.accessUsers),
                    ];
                }

                const recipients = await prepareRecipients([
                    ...project.participants,
                    ...updatedProject.accessUsers,
                    ...project.watchers,
                    project.activity,
                ]);

                await createEmail('projectUpdated', {
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
        .use(projectEditAccessMiddleware)
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
        .use(projectAccessMiddleware)
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
    toggleWatcher: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .use(projectAccessMiddleware)
        .mutation(({ ctx, input: { id, direction } }) => {
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
        .use(projectEditAccessMiddleware)
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

                await createEmail('projectTransfered', {
                    to: await prepareRecipients([newOwner]),
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
    getActivityGoals: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                ownerId: z.string(),
            }),
        )
        .use(projectAccessMiddleware)
        .mutation(async ({ input: { ownerId, id }, ctx }) => {
            const { activityId, role } = ctx.session.user;

            return prisma.goal
                .findMany({
                    where: {
                        ownerId,
                        projectId: id,
                        state: {
                            type: {
                                in: [StateType.InProgress, StateType.NotStarted],
                            },
                        },
                        ...nonArchievedGoalsPartialQuery,
                    },
                })
                .then((goals) =>
                    goals.map((g) => ({
                        ...g,
                        ...addCalculatedGoalsFields(g, activityId, role),
                    })),
                );
        }),
    updateTeams: protectedProcedure
        .input(teamsToProjectSchema)
        .use(projectEditAccessMiddleware)
        .mutation(async ({ input: { id, teams } }) => {
            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    teams: true,
                },
            });

            if (!project) return null;

            const teamsToConnect =
                teams?.filter((externalTeamId) => !project.teams.some((t) => t.externalTeamId === externalTeamId)) ??
                [];
            const teamsToDisconnect = project.teams.filter(
                (t) => !teams?.some((externalTeamId) => externalTeamId === t.externalTeamId),
            );

            return prisma.project.update({
                where: {
                    id,
                },
                data: {
                    teams: {
                        connectOrCreate: teamsToConnect.map((externalTeamId) => ({
                            where: {
                                externalTeamId,
                            },
                            create: {
                                externalTeamId,
                            },
                        })),
                        disconnect: teamsToDisconnect.map((p) => ({ id: p.id })),
                    },
                },
            });
        }),
    addParticipants: protectedProcedure
        .input(participantsToProjectSchema)
        .use(projectEditAccessMiddleware)
        .mutation(async ({ input: { id, participants }, ctx }) => {
            try {
                const [updatedProject, recipients] = await Promise.all([
                    prisma.project.update({
                        where: { id },
                        data: {
                            participants: {
                                connect: participants.map((id) => ({ id })),
                            },
                        },
                    }),
                    prisma.activity.findMany({ where: { id: { in: participants } }, include: { user: true } }),
                ]);

                await createEmail('addParticipantsToProject', {
                    to: await prepareRecipients(recipients),
                    key: updatedProject.id,
                    title: updatedProject.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedProject;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeParticipants: protectedProcedure
        .input(participantsToProjectSchema)
        .use(projectEditAccessMiddleware)
        .mutation(async ({ input: { id, participants }, ctx }) => {
            try {
                const [updatedProject, recipients] = await Promise.all([
                    prisma.project.update({
                        where: { id },
                        data: {
                            participants: {
                                disconnect: participants.map((id) => ({ id })),
                            },
                        },
                    }),
                    prisma.activity.findMany({ where: { id: { in: participants } }, include: { user: true } }),
                ]);

                await createEmail('removeParticipantsToProject', {
                    to: await prepareRecipients(recipients),
                    key: updatedProject.id,
                    title: updatedProject.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedProject;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
});
