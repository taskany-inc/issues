import { z } from 'zod';
import { translit } from '@taskany/bricks';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { getGoalDeepQuery } from '../queries/goals';
import { getProjectAccessFilter } from '../queries/access';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';
import { getProjectsEditableStatus } from '../../src/utils/db/getProjectEditable';
import { nonArchivedPartialQuery } from '../queries/project';
import { processEvent } from '../../src/utils/analyticsEvent';

export const search = router({
    global: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const { activityId, role } = ctx.session.user;

        const translitInput = translit(input);

        processEvent({
            eventType: 'searchQuery',
            url: ctx.headers.referer || '',
            session: ctx.session,
            uaHeader: ctx.headers['user-agent'],
            additionalData: { query: translitInput, rawQuery: input },
        });

        const [goals, projects] = await Promise.all([
            prisma.goal.findMany({
                take: 5,
                orderBy: {
                    _relevance: {
                        fields: ['title', 'description'],
                        // https://github.com/prisma/prisma/issues/8939#issuecomment-933990947
                        search: input.replace(/[\s\n\t]/g, '_'),
                        sort: 'asc',
                    },
                },
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    title: {
                                        contains: translitInput,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    title: {
                                        contains: input,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    description: {
                                        contains: input,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                        {
                            archived: {
                                not: true,
                            },
                        },
                        {
                            project: {
                                ...getProjectAccessFilter(activityId),
                            },
                        },
                    ],
                },
                include: getGoalDeepQuery({
                    activityId,
                }),
            }),
            prisma.project.findMany({
                take: 5,
                orderBy: {
                    _relevance: {
                        fields: ['title', 'description'],
                        search: input.replace(/[\s\n\t]/g, '_'),
                        sort: 'asc',
                    },
                },
                where: {
                    personal: false,
                    OR: [
                        {
                            title: {
                                contains: translitInput,
                                mode: 'insensitive',
                            },
                        },
                        {
                            title: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    AND: {
                        ...getProjectAccessFilter(activityId),
                        ...nonArchivedPartialQuery,
                    },
                },
                include: {
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                },
            }),
        ]);

        const projectIds = goals.map((g) => g.projectId || '').filter(Boolean);
        const editableMap = await getProjectsEditableStatus(projectIds, activityId, role);

        processEvent({
            eventType: 'searchResults',
            url: ctx.headers.referer || '',
            session: ctx.session,
            uaHeader: ctx.headers['user-agent'],
            additionalData: {
                projectsCount: projects.length,
                goalsCount: goals.length,
                foundProjectIds: projects.map(({ id }) => id).join(','),
                foundGoalIds: goals.map(({ id }) => id).join(','),
            },
        });

        return {
            goals: goals.map((g) => ({
                ...g,
                ...addCalculatedGoalsFields(
                    g,
                    { _isEditable: Boolean(g.projectId && editableMap.get(g.projectId)) },
                    activityId,
                    role,
                ),
            })),
            projects,
        };
    }),
});
