import { QueryWithFilters } from '../../src/schema/common';

import { goalsFilter } from './goals';

export const nonArchivedPartialQuery = {
    OR: [{ archived: null }, { archived: false }],
};

export const getProjectSchema = ({
    goalsQuery,
    activityId,
    firstLevel,
    whereQuery,
}: {
    activityId?: string;
    goalsQuery?: QueryWithFilters;
    firstLevel?: boolean;
    whereQuery?: Record<string, unknown>;
} = {}) => {
    let whereFilter: Record<string, unknown> = { ...whereQuery, ...nonArchivedPartialQuery };

    if (firstLevel) {
        whereFilter = {
            ...whereFilter,
            parent: {
                none: {},
            },
        };
    }
    return {
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
                    goals:
                        goalsQuery && activityId
                            ? {
                                  where: goalsFilter(goalsQuery, activityId).where,
                              }
                            : true,
                    parent: true,
                },
            },
        },
        where: whereFilter,
    };
};
