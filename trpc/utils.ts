import { ColumnType } from 'kysely';
import prisma from '@prisma/client';

import { Timestamp } from '../generated/kysely/types';
import { ReactionsMap } from '../src/types/reactions';
import { safeGetUserName } from '../src/utils/getUserName';

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

export enum ProjectRoles {
    'project_owner',
    'project_participant',
    'project_stargizer',
    'project_watcher',
    'goal_owner',
    'goal_issuer',
    'goal_participant',
    'goal_stargizer',
    'goal_watcher',
    'goal_partner',
}

export interface ProjectRules {
    projectFullAccess: boolean;
    projectOnlySubsGoals: boolean;
}

export const calculateProjectRules = (roles: ProjectRoles[]): ProjectRules => {
    const rules: ProjectRules = {
        projectFullAccess: false,
        projectOnlySubsGoals: false,
    };

    if (roles.some((role) => ProjectRoles[role].startsWith('project_'))) {
        rules.projectFullAccess = true;
    } else {
        rules.projectOnlySubsGoals = true;
    }

    return rules;
};
