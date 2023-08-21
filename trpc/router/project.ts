import { Activity, Prisma, Project, Role, User } from '@prisma/client';
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
import { fillProject, sqlGoalsFilter } from '../queries/sqlProject';
import { createEmailJob } from '../../src/utils/worker/create';
import { FieldDiff } from '../../src/types/common';

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

        const nonArchived = {
            archived: false,
        };

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
                                nonArchived,
                            ],
                        },
                        include: goalDeepQuery,
                    },
                    _count: {
                        select: {
                            // all goals without filters to count the total goals
                            goals: {
                                where: nonArchived,
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
                        },
                        {
                            goals: {
                                some: {
                                    AND: [
                                        {
                                            OR: requestSchema({ withOwner: true }),
                                        },
                                        nonArchived,
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
                            _estimate: getEstimateListFormJoin(goal),
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
        .query(async ({ ctx, input: { goalsQuery = {}, firstLevel } = {} }) => {
            const { activityId, role } = ctx.session.user;

            const stateByTypes = goalsQuery?.stateType
                ? await prisma.state.findMany({
                      where: {
                          type: {
                              in: goalsQuery.stateType,
                          },
                      },
                  })
                : [];

            stateByTypes.forEach((state) => {
                if (!goalsQuery.state) {
                    goalsQuery.state = [];
                }

                if (!goalsQuery.state.includes(state.id)) {
                    goalsQuery.state.push(state.id);
                }
            });

            const sqlFilters = sqlGoalsFilter(activityId, goalsQuery);

            const [projects, watchers, stargizers, projectsChildrenParent] = await Promise.all([
                prisma.$queryRaw`
                    select
                        p.id,
                        p.title,
                        p.description,
                        p."flowId",
                        p."createdAt",
                        p."updatedAt",
                        p."activityId",
                        count(distinct g) as "goalsCount"
                    from "Project" as p
                    left join "Goal" as g on p.id = g."projectId"
                    left join "Activity" as a on a.id = p."activityId"
                    left join "Tag" as t on g."activityId" = t."activityId"
                    left join "_projectStargizers" as ps on ps."B" = p.id
                    left join "_projectWatchers" as pw on pw."B" = p.id
                    left join "_goalStargizers" as gs on gs."B" = g.id
                    left join "_goalWatchers" as gw on gw."B" = g.id
                    left join "_goalParticipants" as gp on gp."B" = g.id
                    left join "_parentChildren" as pc on pc."B" = p.id
                    where g."archived" = ${false}
                        ${sqlFilters}
                        ${firstLevel ? Prisma.sql`and pc."A" is null` : Prisma.empty}
                    group by p.id
                    order by max(g."updatedAt") desc
            ` as Promise<NonNullable<(Project & { goalsCount: number })[]>>,
                prisma.$queryRaw`
                        select pw."A" as id, pw."B" as "projectId"
                        from "_projectWatchers" as pw
                        where pw."A" in (${activityId})
            ` as Promise<{ id: string; projectId: string }[]>,
                prisma.$queryRaw`
                        select ps."A" as id, ps."B" as "projectId"
                        from "_projectStargizers" as ps
                        where ps."A" in (${activityId})
            ` as Promise<{ id: string; projectId: string }[]>,
                prisma.$queryRaw`
                    select
                        pc."A" as "parentProjectId",
                        pc."B" as "projectId"
                    from "Project" as p
                    left join "_parentChildren" as pc on pc."B" = p.id
                    where pc."A" is not null and pc."B" is not null
            ` as Promise<{ parentProjectId: string; projectId: string }[]>,
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

            for (let i = 0; i < Math.max(watchers.length, stargizers.length, projectsChildrenParent.length); i++) {
                const watcher = watchers[i];
                const stargizer = stargizers[i];
                const project = projectsChildrenParent[i];

                fillProject(projectsDict, { watcher, stargizer, project });
            }

            return Object.values(projectsDict)?.map((project) => addCalculatedProjectFields(project, activityId, role));
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
                where: {
                    id: {
                        in: ids,
                    },
                },
                ...getProjectSchema({
                    activityId,
                    goalsQuery,
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
                    ...goalsFilter(goalsQuery, activityId, { projectId: id }),
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
                    _project: g.project ? addCalculatedProjectFields(g.project, activityId, role) : null,
                    ...addCalclulatedGoalsFields(g, activityId, role),
                    _estimate: getEstimateListFormJoin(g),
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
