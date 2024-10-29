import { ColumnType } from 'kysely';
import prisma from '@prisma/client';

import { Timestamp } from '../generated/kysely/types';
import { ReactionsMap } from '../src/types/reactions';
import { safeGetUserName } from '../src/utils/getUserName';
import { getRankSeries } from '../src/utils/ranking';

import { db } from './connection/kysely';

interface UserActivity {
    activity: prisma.Activity & { user: prisma.User; ghost: prisma.Ghost | null };
}

export type DBQuery = ReturnType<(typeof db)['selectFrom']>;

export const extendQuery = <T extends DBQuery>(qb: T, ...extenders: Array<(arg: T) => T>): T => {
    return extenders.reduce((fn, extender) => extender(fn), qb);
};

export const pickUniqueValues = <T, K extends keyof T>(values: T[] | null | void, byKey: K): T[] | null => {
    if (values == null || values.length < 1) {
        return null;
    }

    const uniqueMap = new Map<T[K], T>();

    for (const value of values) {
        const it = uniqueMap.get(value[byKey]);

        if (it == null) {
            uniqueMap.set(value[byKey], value);
        }
    }

    return Array.from(uniqueMap.values());
};

export type ExtractTypeFromGenerated<T> = {
    [K in keyof T]: T[K] extends ColumnType<infer Date, any, any>
        ? Date
        : T[K] extends Timestamp | null
        ? Date | null
        : T[K];
};

export const applyLastStateUpdateComment = (goal: any) => {
    const lastCommentWithUpdateState: prisma.Comment &
        UserActivity & { reactions: (prisma.Reaction & UserActivity)[]; state: prisma.State } = goal.comments?.[0];

    let reactions: ReactionsMap = {};
    if (lastCommentWithUpdateState) {
        const limit = 10;
        reactions = lastCommentWithUpdateState.reactions?.reduce<ReactionsMap>((acc, cur) => {
            const data = {
                activityId: cur.activityId,
                name: safeGetUserName(cur.activity),
            };

            if (acc[cur.emoji]) {
                acc[cur.emoji].count += 1;
                acc[cur.emoji].authors.push(data);
            } else {
                acc[cur.emoji] = {
                    count: 1,
                    authors: [data],
                    remains: 0,
                };
            }

            return acc;
        }, {});

        for (const key in reactions) {
            if (key in reactions) {
                const { authors } = reactions[key];

                if (authors.length > limit) {
                    reactions[key].authors = authors.slice(0, limit);
                    reactions[key].remains = authors.length - limit;
                }
            }
        }

        return {
            _lastComment: {
                ...lastCommentWithUpdateState,
                reactions,
            },
        };
    }

    return null;
};

export const recalculateGoalRanksIfNeeded = async (projectId: string, activityId: string) => {
    const { goalCount } = await db
        .selectFrom('Goal')
        .where('projectId', '=', projectId)
        .select((eb) => eb.fn.count<number>('id').as('goalCount'))
        .executeTakeFirstOrThrow();
    const { rankCount } = await db
        .selectFrom('GoalRank')
        .leftJoin('Goal', 'GoalRank.goalId', 'Goal.id')
        .where('Goal.projectId', '=', projectId)
        .where('Goal.activityId', '=', activityId)
        .select((eb) => eb.fn.count<number>('Goal.id').as('rankCount'))
        .executeTakeFirstOrThrow();
    if (goalCount === rankCount) return;
    const ranks = getRankSeries(goalCount);
    const goals = await db
        .selectFrom('Goal')
        .where('projectId', '=', projectId)
        .leftJoin(
            (eb) =>
                eb.selectFrom('GoalRank').select(['goalId', 'value']).where('activityId', '=', activityId).as('ranks'),
            (join) => join.onRef('ranks.goalId', '=', 'Goal.id'),
        )
        .orderBy('ranks.value asc')
        .orderBy('updatedAt desc')
        .select(['id'])
        .execute();
    await db
        .insertInto('GoalRank')
        .values(goals.map((g, i) => ({ activityId, goalId: g.id, value: ranks[i] })))
        .onConflict((oc) =>
            oc.columns(['activityId', 'goalId']).doUpdateSet({ value: (eb) => eb.ref('excluded.value') }),
        )
        .execute();
};
