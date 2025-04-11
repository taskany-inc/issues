export const getProjectAccessFilter = (activityId: string) => {
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

export const goalAchiveCriteriaFilter = (activityId: string) => ({
    OR: [
        {
            criteriaGoal: null,
        },
        {
            criteriaGoal: {
                project: {
                    ...getProjectAccessFilter(activityId),
                },
            },
        },
    ],
});
