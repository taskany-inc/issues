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
