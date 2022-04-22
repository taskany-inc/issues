module.exports = {
    scalars: [1, 2, 4, 5, 9, 14, 15, 20],
    types: {
        Activity: {
            createdAt: [2],
            ghost: [7],
            id: [1],
            tags: [17],
            updatedAt: [2],
            user: [18],
            __typename: [4],
        },
        ID: {},
        DateTime: {},
        Estimate: {
            date: [4],
            id: [5],
            q: [4],
            y: [4],
            __typename: [4],
        },
        String: {},
        Int: {},
        Flow: {
            graph: [4],
            id: [1],
            projects: [12],
            states: [16],
            title: [4],
            __typename: [4],
        },
        Ghost: {
            activity: [0],
            createdAt: [2],
            email: [4],
            host: [18],
            hostId: [4],
            id: [1],
            updatedAt: [2],
            user: [18],
            __typename: [4],
        },
        Goal: {
            blocks: [8],
            computedOwner: [19],
            connected: [8],
            createdAt: [2],
            dependsOn: [8],
            description: [4],
            estimate: [3],
            id: [5],
            issuer: [0],
            issuerId: [4],
            key: [9],
            owner: [0],
            ownerId: [4],
            participants: [0],
            personal: [9],
            private: [9],
            project: [12],
            projectId: [5],
            relatedTo: [8],
            state: [16],
            stateId: [4],
            tags: [17],
            title: [4],
            updatedAt: [2],
            __typename: [4],
        },
        Boolean: {},
        GoalEstimate: {
            date: [4],
            q: [4],
            y: [4],
            __typename: [4],
        },
        Mutation: {
            createGoal: [
                8,
                {
                    description: [4, 'String!'],
                    estimate: [10],
                    key: [9],
                    ownerId: [4, 'String!'],
                    personal: [9],
                    private: [9],
                    projectId: [5, 'Int!'],
                    stateId: [4],
                    tags: [4, '[String!]'],
                    title: [4, 'String!'],
                    user: [21, 'UserSession!'],
                },
            ],
            createProject: [
                12,
                {
                    description: [4],
                    flowId: [4, 'String!'],
                    ownerId: [4, 'String!'],
                    title: [4, 'String!'],
                    user: [21, 'UserSession!'],
                },
            ],
            createTag: [
                17,
                {
                    color: [4, 'String!'],
                    description: [4],
                    title: [4, 'String!'],
                    user: [21, 'UserSession!'],
                },
            ],
            inviteUser: [
                7,
                {
                    email: [4, 'String!'],
                    user: [21, 'UserSession!'],
                },
            ],
            __typename: [4],
        },
        Project: {
            computedOwner: [19],
            createdAt: [2],
            description: [4],
            flow: [6],
            goals: [8],
            id: [5],
            owner: [0],
            slug: [4],
            tags: [17],
            title: [4],
            updatedAt: [2],
            __typename: [4],
        },
        Query: {
            findUserAnyKind: [
                19,
                {
                    query: [4, 'String!'],
                    sortBy: [15],
                },
            ],
            flow: [
                6,
                {
                    id: [4, 'String!'],
                },
            ],
            flowCompletion: [
                6,
                {
                    query: [4, 'String!'],
                    sortBy: [15],
                },
            ],
            flowRecommended: [6],
            project: [
                12,
                {
                    slug: [4, 'String!'],
                },
            ],
            projectCompletion: [
                12,
                {
                    query: [4, 'String!'],
                    sortBy: [15],
                },
            ],
            projectGoals: [
                8,
                {
                    slug: [4, 'String!'],
                },
            ],
            tagCompletion: [
                17,
                {
                    query: [4, 'String!'],
                    sortBy: [15],
                },
            ],
            users: [
                18,
                {
                    sortBy: [15],
                },
            ],
            __typename: [4],
        },
        Role: {},
        SortOrder: {},
        State: {
            default: [9],
            flows: [6],
            id: [1],
            title: [4],
            __typename: [4],
        },
        Tag: {
            activity: [0],
            activityId: [4],
            color: [4],
            description: [4],
            goals: [8],
            id: [1],
            projects: [12],
            title: [4],
            __typename: [4],
        },
        User: {
            activity: [0],
            activityId: [4],
            createdAt: [2],
            email: [4],
            id: [1],
            image: [4],
            name: [4],
            role: [14],
            updatedAt: [2],
            __typename: [4],
        },
        UserAnyKind: {
            activity: [0],
            email: [4],
            id: [4],
            image: [4],
            kind: [20],
            name: [4],
            __typename: [4],
        },
        UserKind: {},
        UserSession: {
            email: [4],
            id: [1],
            image: [4],
            name: [4],
            role: [14],
            __typename: [4],
        },
    },
};
