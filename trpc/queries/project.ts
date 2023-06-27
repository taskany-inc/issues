import { QueryWithFilters } from '../../src/schema/common';

import { goalsFilter } from './goals';

export const getProjectSchema = ({
    goalsQuery,
    activityId,
    firstLevel,
}: {
    activityId?: string;
    goalsQuery?: QueryWithFilters;
    firstLevel?: boolean;
} = {}) => ({
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
    ...(firstLevel
        ? {
              where: {
                  parent: {
                      none: {},
                  },
              },
          }
        : {}),
});
