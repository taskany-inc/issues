import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import {
    getDeepParentGoalIds,
    getDeepChildrenGoalIds,
    getGoalsForCSVExport,
    getAllGoalsQuery,
} from '../queries/goalV2';
import { goalEditAccessMiddleware } from '../access/accessMiddlewares';
import { db } from '../../src/utils/db/connection/kysely';
import { getMiddleRank } from '../../src/utils/ranking';
import { getGoalRank, updateGoalRanks } from '../queries/ranking';
import { filterQuery } from '../queries/filter';
import { parseFilterValues } from '../../src/utils/parseUrlParams';
import { ExtractTypeFromGenerated, pickUniqueValues } from '../utils';
import { queryWithFiltersSchema } from '../../src/schema/common';
import { baseCalcCriteriaWeight } from '../../src/utils/recalculateCriteriaScore';
import { Activity } from '../queries/activity';
import {
    Tag,
    State,
    Priority,
    Project,
    GoalAchieveCriteria,
    Goal as DbGoal,
} from '../../src/utils/db/generated/kysely/types';

import { tr } from './router.i18n';

interface GoalItemForExport {
    id: string;
    title: string;
    project: string;
    estimate: Date | null;
    estimateType: 'Year' | 'Quarter' | 'Strict' | null;
    priority: 'High' | 'Highest' | 'Medium' | 'Low';
    state: string;
}

type Goal = ExtractTypeFromGenerated<DbGoal> & {
    _shortId: string;
    participants: Activity[];
    tags: ExtractTypeFromGenerated<Tag>[];
    owner: Activity;
    _achivedCriteriaWeight: number | null;
    state: ExtractTypeFromGenerated<State>;
    priority: ExtractTypeFromGenerated<Priority>;
    project: ExtractTypeFromGenerated<Project> & { parent: ExtractTypeFromGenerated<Project>[] };
    partnershipProjects: Array<ExtractTypeFromGenerated<Project>>;
    criteria?: Array<
        ExtractTypeFromGenerated<
            GoalAchieveCriteria & {
                criteriaGoal: ExtractTypeFromGenerated<Goal> & { state: ExtractTypeFromGenerated<State> | null };
            }
        >
    >;
    _count: {
        comments: number;
    };
    _isWatching: boolean;
    _isStarred: boolean;
    _isOwner: boolean;
    _isEditable: boolean;
    _isIssuer: boolean;
    _isParticipant: boolean;
    _isParentParticipant: boolean;
    _isParentOwner: boolean;
    _hasAchievementCriteria: boolean;
};

export const goal = router({
    getParentIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepParentGoalIds(input).execute();
    }),

    getChildrenIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepChildrenGoalIds(input).execute();
    }),

    updateRank: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                low: z.string().optional(),
                high: z.string().optional(),
                global: z.boolean(),
            }),
        )
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const { projectId } = await db
                .selectFrom('Goal')
                .where('id', '=', input.id)
                .select(['projectId'])
                .executeTakeFirstOrThrow();
            if (!projectId) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: tr("Goal doesn't have a project") });
            }
            const activityId = input.global ? undefined : ctx.session.user.activityId;

            const [low, high] = await Promise.all([
                input.low ? getGoalRank(input.low, activityId).executeTakeFirst() : undefined,
                input.high ? getGoalRank(input.high, activityId).executeTakeFirst() : undefined,
            ]);
            const newRank = getMiddleRank({ low: low?.value, high: high?.value });

            await updateGoalRanks([{ goalId: input.id, value: newRank }], activityId).execute();
        }),
    exportCsv: protectedProcedure
        .input(
            z.object({
                filterPresetId: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const currentFilterPreset = await filterQuery({
                activityId: ctx.session.user.activityId,
                id: input.filterPresetId,
            }).executeTakeFirst();

            if (currentFilterPreset == null) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED' });
            }

            const filterParams = new URLSearchParams(currentFilterPreset.params);
            const preparedFilterParams = parseFilterValues(Object.fromEntries(filterParams));

            const query = getGoalsForCSVExport({
                ...ctx.session.user,
                goalsQuery: preparedFilterParams,
            }).$castTo<GoalItemForExport>();

            const goalListForExport = await query.execute();

            const dataForExport = pickUniqueValues(goalListForExport, 'id');

            if (dataForExport == null || dataForExport.length === 0) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED' });
            }

            return {
                currentPreset: currentFilterPreset,
                dataForExport,
            };
        }),
    getAllGoals: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                cursor: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ ctx, input: { goalsQuery, limit = 20, cursor: offset = 0 } }) => {
            const query = getAllGoalsQuery({
                goalsQuery,
                limit: limit + 1,
                offset,
                ...ctx.session.user,
            });

            const goals = await query.$castTo<Goal>().execute();

            for (const goal of goals) {
                goal._achivedCriteriaWeight = goal.completedCriteriaWeight;

                if (goal.criteria != null) {
                    const uniqCriteria = pickUniqueValues(goal.criteria, 'id') as NonNullable<Goal['criteria']>;
                    goal._achivedCriteriaWeight = baseCalcCriteriaWeight(uniqCriteria);
                    goal.criteria = uniqCriteria;
                }
            }

            return {
                goals: goals.slice(0, limit),
                pagination: {
                    limit,
                    offset: goals.length < limit + 1 ? undefined : offset + (limit ?? 0),
                },
            };
        }),
});
