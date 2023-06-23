export const projectFullSchema = {
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
            goals: true,
        },
    },
};
