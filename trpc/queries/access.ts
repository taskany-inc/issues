import { Role } from '@prisma/client';

export const getProjectAccessFilter = (activityId: string, role: Role) => {
    if (role === 'ADMIN') {
        return {};
    }

    return {
        AND: {
            OR: [
                { activityId },
                {
                    accessUsers: {
                        some: {
                            id: activityId,
                        },
                    },
                },
                {
                    accessUsers: {
                        none: {},
                    },
                },
            ],
        },
    };
};

export const goalAchiveCriteriaFilter = (activityId: string, role: Role) => ({
    OR: [
        {
            criteriaGoal: null,
        },
        {
            criteriaGoal: {
                project: {
                    ...getProjectAccessFilter(activityId, role),
                },
            },
        },
    ],
});
