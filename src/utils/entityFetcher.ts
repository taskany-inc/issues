import { createFetcher } from './createFetcher';

export const refreshInterval = 3000;

export const goalFetcher = createFetcher((_, id: string) => ({
    goalPriorityColors: true,
    goalPriorityKind: true,
    goal: [
        {
            id,
        },
        {
            id: true,
            title: true,
            description: true,
            activityId: true,
            ownerId: true,
            kind: true,
            state: {
                id: true,
                title: true,
                hue: true,
            },
            priority: true,
            estimate: {
                date: true,
                q: true,
                y: true,
            },
            createdAt: true,
            updatedAt: true,
            team: {
                id: true,
                key: true,
                slug: true,
                title: true,
                description: true,
                flowId: true,
                flow: {
                    id: true,
                    states: {
                        id: true,
                        title: true,
                        default: true,
                        hue: true,
                    },
                },
            },
            project: {
                id: true,
                key: true,
                title: true,
                description: true,
                flowId: true,
                flow: {
                    id: true,
                    states: {
                        id: true,
                        title: true,
                        default: true,
                        hue: true,
                    },
                },
                teams: {
                    id: true,
                    key: true,
                    slug: true,
                    title: true,
                },
            },
            activity: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
            owner: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            reactions: {
                id: true,
                emoji: true,
                activity: {
                    user: {
                        id: true,
                        name: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
            },
            dependsOn: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
            relatedTo: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
            blocks: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
            comments: {
                id: true,
                description: true,
                createdAt: true,
                activity: {
                    id: true,
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
                reactions: {
                    id: true,
                    emoji: true,
                    activity: {
                        user: {
                            id: true,
                            name: true,
                        },
                        ghost: {
                            id: true,
                            email: true,
                        },
                    },
                },
            },
            participants: {
                id: true,
                user: {
                    id: true,
                    email: true,
                    name: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
            _count: {
                stargizers: true,
                comments: true,
            },
            _isStarred: true,
            _isWatching: true,
            _isIssuer: true,
            _isOwner: true,
            _isEditable: true,
            _lastEstimate: {
                date: true,
                q: true,
                y: true,
            },
            _isParticipant: true,
        },
    ],
}));
