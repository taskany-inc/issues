import { FieldsSelection, Observable } from '@genql/runtime';

export type Scalars = {
    ID: string;
    DateTime: any;
    String: string;
    Int: number;
    Boolean: boolean;
};

export interface Activity {
    createdAt: Scalars['DateTime'];
    ghost?: Ghost;
    id: Scalars['ID'];
    tags?: (Tag | undefined)[];
    updatedAt: Scalars['DateTime'];
    user?: User;
    __typename: 'Activity';
}

export interface Estimate {
    date?: Scalars['String'];
    id: Scalars['Int'];
    q?: Scalars['String'];
    y?: Scalars['String'];
    __typename: 'Estimate';
}

export interface Flow {
    graph?: Scalars['String'];
    id: Scalars['ID'];
    projects?: (Project | undefined)[];
    states?: (State | undefined)[];
    title: Scalars['String'];
    __typename: 'Flow';
}

export interface Ghost {
    activity?: Activity;
    createdAt: Scalars['DateTime'];
    email: Scalars['String'];
    host?: User;
    hostId: Scalars['String'];
    id: Scalars['ID'];
    updatedAt: Scalars['DateTime'];
    user?: User;
    __typename: 'Ghost';
}

export interface Goal {
    blocks?: (Goal | undefined)[];
    computedOwner?: UserAnyKind;
    connected?: (Goal | undefined)[];
    createdAt: Scalars['DateTime'];
    dependsOn?: (Goal | undefined)[];
    description: Scalars['String'];
    estimate?: Estimate;
    id: Scalars['Int'];
    issuer?: Activity;
    issuerId?: Scalars['String'];
    key?: Scalars['Boolean'];
    owner?: Activity;
    ownerId?: Scalars['String'];
    participants?: (Activity | undefined)[];
    personal?: Scalars['Boolean'];
    private?: Scalars['Boolean'];
    project?: Project;
    projectId?: Scalars['Int'];
    relatedTo?: (Goal | undefined)[];
    state?: State;
    stateId?: Scalars['String'];
    tags?: (Tag | undefined)[];
    title: Scalars['String'];
    updatedAt: Scalars['DateTime'];
    __typename: 'Goal';
}

export interface Mutation {
    createGoal?: Goal;
    createProject?: Project;
    createTag?: Tag;
    inviteUser?: Ghost;
    __typename: 'Mutation';
}

export interface Project {
    computedOwner?: UserAnyKind;
    createdAt: Scalars['DateTime'];
    description?: Scalars['String'];
    flow?: Flow;
    goals?: (Goal | undefined)[];
    id: Scalars['Int'];
    owner?: Activity;
    slug?: Scalars['String'];
    tags?: (Tag | undefined)[];
    title: Scalars['String'];
    updatedAt: Scalars['DateTime'];
    __typename: 'Project';
}

export interface Query {
    findUserAnyKind?: (UserAnyKind | undefined)[];
    flow?: Flow;
    flowCompletion?: (Flow | undefined)[];
    flowRecommended?: (Flow | undefined)[];
    project?: Project;
    projectCompletion?: (Project | undefined)[];
    projectGoals?: (Goal | undefined)[];
    tagCompletion?: (Tag | undefined)[];
    users?: (User | undefined)[];
    __typename: 'Query';
}

export type Role = 'ADMIN' | 'USER';

export type SortOrder = 'asc' | 'desc';

export interface State {
    default?: Scalars['Boolean'];
    flows?: (Flow | undefined)[];
    id: Scalars['ID'];
    title: Scalars['String'];
    __typename: 'State';
}

export interface Tag {
    activity?: Activity;
    activityId?: Scalars['String'];
    color: Scalars['String'];
    description?: Scalars['String'];
    goals?: (Goal | undefined)[];
    id: Scalars['ID'];
    projects?: (Project | undefined)[];
    title: Scalars['String'];
    __typename: 'Tag';
}

export interface User {
    activity?: Activity;
    activityId?: Scalars['String'];
    createdAt: Scalars['DateTime'];
    email: Scalars['String'];
    id: Scalars['ID'];
    image?: Scalars['String'];
    name?: Scalars['String'];
    role: Role;
    updatedAt: Scalars['DateTime'];
    __typename: 'User';
}

export interface UserAnyKind {
    activity?: Activity;
    email?: Scalars['String'];
    id?: Scalars['String'];
    image?: Scalars['String'];
    kind?: UserKind;
    name?: Scalars['String'];
    __typename: 'UserAnyKind';
}

export type UserKind = 'GHOST' | 'USER';

export interface ActivityRequest {
    createdAt?: boolean | number;
    ghost?: GhostRequest;
    id?: boolean | number;
    tags?: TagRequest;
    updatedAt?: boolean | number;
    user?: UserRequest;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface EstimateRequest {
    date?: boolean | number;
    id?: boolean | number;
    q?: boolean | number;
    y?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface FlowRequest {
    graph?: boolean | number;
    id?: boolean | number;
    projects?: ProjectRequest;
    states?: StateRequest;
    title?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface GhostRequest {
    activity?: ActivityRequest;
    createdAt?: boolean | number;
    email?: boolean | number;
    host?: UserRequest;
    hostId?: boolean | number;
    id?: boolean | number;
    updatedAt?: boolean | number;
    user?: UserRequest;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface GoalRequest {
    blocks?: GoalRequest;
    computedOwner?: UserAnyKindRequest;
    connected?: GoalRequest;
    createdAt?: boolean | number;
    dependsOn?: GoalRequest;
    description?: boolean | number;
    estimate?: EstimateRequest;
    id?: boolean | number;
    issuer?: ActivityRequest;
    issuerId?: boolean | number;
    key?: boolean | number;
    owner?: ActivityRequest;
    ownerId?: boolean | number;
    participants?: ActivityRequest;
    personal?: boolean | number;
    private?: boolean | number;
    project?: ProjectRequest;
    projectId?: boolean | number;
    relatedTo?: GoalRequest;
    state?: StateRequest;
    stateId?: boolean | number;
    tags?: TagRequest;
    title?: boolean | number;
    updatedAt?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface GoalEstimate {
    date?: Scalars['String'] | null;
    q?: Scalars['String'] | null;
    y?: Scalars['String'] | null;
}

export interface MutationRequest {
    createGoal?: [
        {
            description: Scalars['String'];
            estimate?: GoalEstimate | null;
            key?: Scalars['Boolean'] | null;
            ownerId: Scalars['String'];
            personal?: Scalars['Boolean'] | null;
            private?: Scalars['Boolean'] | null;
            projectId: Scalars['Int'];
            stateId?: Scalars['String'] | null;
            tags?: Scalars['String'][] | null;
            title: Scalars['String'];
            user: UserSession;
        },
        GoalRequest,
    ];
    createProject?: [
        {
            description?: Scalars['String'] | null;
            flowId: Scalars['String'];
            ownerId: Scalars['String'];
            title: Scalars['String'];
            user: UserSession;
        },
        ProjectRequest,
    ];
    createTag?: [
        {
            color: Scalars['String'];
            description?: Scalars['String'] | null;
            title: Scalars['String'];
            user: UserSession;
        },
        TagRequest,
    ];
    inviteUser?: [{ email: Scalars['String']; user: UserSession }, GhostRequest];
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface ProjectRequest {
    computedOwner?: UserAnyKindRequest;
    createdAt?: boolean | number;
    description?: boolean | number;
    flow?: FlowRequest;
    goals?: GoalRequest;
    id?: boolean | number;
    owner?: ActivityRequest;
    slug?: boolean | number;
    tags?: TagRequest;
    title?: boolean | number;
    updatedAt?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface QueryRequest {
    findUserAnyKind?: [{ query: Scalars['String']; sortBy?: SortOrder | null }, UserAnyKindRequest];
    flow?: [{ id: Scalars['String'] }, FlowRequest];
    flowCompletion?: [{ query: Scalars['String']; sortBy?: SortOrder | null }, FlowRequest];
    flowRecommended?: FlowRequest;
    project?: [{ slug: Scalars['String'] }, ProjectRequest];
    projectCompletion?: [{ query: Scalars['String']; sortBy?: SortOrder | null }, ProjectRequest];
    projectGoals?: [{ slug: Scalars['String'] }, GoalRequest];
    tagCompletion?: [{ query: Scalars['String']; sortBy?: SortOrder | null }, TagRequest];
    users?: [{ sortBy?: SortOrder | null }, UserRequest] | UserRequest;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface StateRequest {
    default?: boolean | number;
    flows?: FlowRequest;
    id?: boolean | number;
    title?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface TagRequest {
    activity?: ActivityRequest;
    activityId?: boolean | number;
    color?: boolean | number;
    description?: boolean | number;
    goals?: GoalRequest;
    id?: boolean | number;
    projects?: ProjectRequest;
    title?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface UserRequest {
    activity?: ActivityRequest;
    activityId?: boolean | number;
    createdAt?: boolean | number;
    email?: boolean | number;
    id?: boolean | number;
    image?: boolean | number;
    name?: boolean | number;
    role?: boolean | number;
    updatedAt?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface UserAnyKindRequest {
    activity?: ActivityRequest;
    email?: boolean | number;
    id?: boolean | number;
    image?: boolean | number;
    kind?: boolean | number;
    name?: boolean | number;
    __typename?: boolean | number;
    __scalar?: boolean | number;
}

export interface UserSession {
    email: Scalars['String'];
    id: Scalars['ID'];
    image?: Scalars['String'] | null;
    name?: Scalars['String'] | null;
    role: Role;
}

const Activity_possibleTypes = ['Activity'];
export const isActivity = (obj?: { __typename?: any } | null): obj is Activity => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isActivity"');
    return Activity_possibleTypes.includes(obj.__typename);
};

const Estimate_possibleTypes = ['Estimate'];
export const isEstimate = (obj?: { __typename?: any } | null): obj is Estimate => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isEstimate"');
    return Estimate_possibleTypes.includes(obj.__typename);
};

const Flow_possibleTypes = ['Flow'];
export const isFlow = (obj?: { __typename?: any } | null): obj is Flow => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isFlow"');
    return Flow_possibleTypes.includes(obj.__typename);
};

const Ghost_possibleTypes = ['Ghost'];
export const isGhost = (obj?: { __typename?: any } | null): obj is Ghost => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isGhost"');
    return Ghost_possibleTypes.includes(obj.__typename);
};

const Goal_possibleTypes = ['Goal'];
export const isGoal = (obj?: { __typename?: any } | null): obj is Goal => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isGoal"');
    return Goal_possibleTypes.includes(obj.__typename);
};

const Mutation_possibleTypes = ['Mutation'];
export const isMutation = (obj?: { __typename?: any } | null): obj is Mutation => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isMutation"');
    return Mutation_possibleTypes.includes(obj.__typename);
};

const Project_possibleTypes = ['Project'];
export const isProject = (obj?: { __typename?: any } | null): obj is Project => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isProject"');
    return Project_possibleTypes.includes(obj.__typename);
};

const Query_possibleTypes = ['Query'];
export const isQuery = (obj?: { __typename?: any } | null): obj is Query => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isQuery"');
    return Query_possibleTypes.includes(obj.__typename);
};

const State_possibleTypes = ['State'];
export const isState = (obj?: { __typename?: any } | null): obj is State => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isState"');
    return State_possibleTypes.includes(obj.__typename);
};

const Tag_possibleTypes = ['Tag'];
export const isTag = (obj?: { __typename?: any } | null): obj is Tag => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isTag"');
    return Tag_possibleTypes.includes(obj.__typename);
};

const User_possibleTypes = ['User'];
export const isUser = (obj?: { __typename?: any } | null): obj is User => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isUser"');
    return User_possibleTypes.includes(obj.__typename);
};

const UserAnyKind_possibleTypes = ['UserAnyKind'];
export const isUserAnyKind = (obj?: { __typename?: any } | null): obj is UserAnyKind => {
    if (!obj?.__typename) throw new Error('__typename is missing in "isUserAnyKind"');
    return UserAnyKind_possibleTypes.includes(obj.__typename);
};

export interface ActivityPromiseChain {
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    ghost: GhostPromiseChain & {
        get: <R extends GhostRequest>(
            request: R,
            defaultValue?: FieldsSelection<Ghost, R> | undefined,
        ) => Promise<FieldsSelection<Ghost, R> | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    user: UserPromiseChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Promise<FieldsSelection<User, R> | undefined>;
    };
}

export interface ActivityObservableChain {
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    ghost: GhostObservableChain & {
        get: <R extends GhostRequest>(
            request: R,
            defaultValue?: FieldsSelection<Ghost, R> | undefined,
        ) => Observable<FieldsSelection<Ghost, R> | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    user: UserObservableChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Observable<FieldsSelection<User, R> | undefined>;
    };
}

export interface EstimatePromiseChain {
    date: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']> };
    q: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    y: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
}

export interface EstimateObservableChain {
    date: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']> };
    q: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    y: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
}

export interface FlowPromiseChain {
    graph: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    projects: {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    states: {
        get: <R extends StateRequest>(
            request: R,
            defaultValue?: (FieldsSelection<State, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<State, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
}

export interface FlowObservableChain {
    graph: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    projects: {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    states: {
        get: <R extends StateRequest>(
            request: R,
            defaultValue?: (FieldsSelection<State, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<State, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
}

export interface GhostPromiseChain {
    activity: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    email: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    host: UserPromiseChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Promise<FieldsSelection<User, R> | undefined>;
    };
    hostId: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    user: UserPromiseChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Promise<FieldsSelection<User, R> | undefined>;
    };
}

export interface GhostObservableChain {
    activity: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    email: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    host: UserObservableChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Observable<FieldsSelection<User, R> | undefined>;
    };
    hostId: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    user: UserObservableChain & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: FieldsSelection<User, R> | undefined,
        ) => Observable<FieldsSelection<User, R> | undefined>;
    };
}

export interface GoalPromiseChain {
    blocks: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    computedOwner: UserAnyKindPromiseChain & {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: FieldsSelection<UserAnyKind, R> | undefined,
        ) => Promise<FieldsSelection<UserAnyKind, R> | undefined>;
    };
    connected: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    dependsOn: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    description: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    estimate: EstimatePromiseChain & {
        get: <R extends EstimateRequest>(
            request: R,
            defaultValue?: FieldsSelection<Estimate, R> | undefined,
        ) => Promise<FieldsSelection<Estimate, R> | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']> };
    issuer: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    issuerId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    key: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Promise<Scalars['Boolean'] | undefined>;
    };
    owner: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    ownerId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    participants: {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Activity, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Activity, R> | undefined)[] | undefined>;
    };
    personal: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Promise<Scalars['Boolean'] | undefined>;
    };
    private: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Promise<Scalars['Boolean'] | undefined>;
    };
    project: ProjectPromiseChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Promise<FieldsSelection<Project, R> | undefined>;
    };
    projectId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Int'] | undefined,
        ) => Promise<Scalars['Int'] | undefined>;
    };
    relatedTo: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    state: StatePromiseChain & {
        get: <R extends StateRequest>(
            request: R,
            defaultValue?: FieldsSelection<State, R> | undefined,
        ) => Promise<FieldsSelection<State, R> | undefined>;
    };
    stateId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
}

export interface GoalObservableChain {
    blocks: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    computedOwner: UserAnyKindObservableChain & {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: FieldsSelection<UserAnyKind, R> | undefined,
        ) => Observable<FieldsSelection<UserAnyKind, R> | undefined>;
    };
    connected: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    dependsOn: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    description: {
        get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>;
    };
    estimate: EstimateObservableChain & {
        get: <R extends EstimateRequest>(
            request: R,
            defaultValue?: FieldsSelection<Estimate, R> | undefined,
        ) => Observable<FieldsSelection<Estimate, R> | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']> };
    issuer: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    issuerId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    key: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Observable<Scalars['Boolean'] | undefined>;
    };
    owner: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    ownerId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    participants: {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Activity, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Activity, R> | undefined)[] | undefined>;
    };
    personal: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Observable<Scalars['Boolean'] | undefined>;
    };
    private: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Observable<Scalars['Boolean'] | undefined>;
    };
    project: ProjectObservableChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Observable<FieldsSelection<Project, R> | undefined>;
    };
    projectId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Int'] | undefined,
        ) => Observable<Scalars['Int'] | undefined>;
    };
    relatedTo: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    state: StateObservableChain & {
        get: <R extends StateRequest>(
            request: R,
            defaultValue?: FieldsSelection<State, R> | undefined,
        ) => Observable<FieldsSelection<State, R> | undefined>;
    };
    stateId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
}

export interface MutationPromiseChain {
    createGoal: (args: {
        description: Scalars['String'];
        estimate?: GoalEstimate | null;
        key?: Scalars['Boolean'] | null;
        ownerId: Scalars['String'];
        personal?: Scalars['Boolean'] | null;
        private?: Scalars['Boolean'] | null;
        projectId: Scalars['Int'];
        stateId?: Scalars['String'] | null;
        tags?: Scalars['String'][] | null;
        title: Scalars['String'];
        user: UserSession;
    }) => GoalPromiseChain & {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: FieldsSelection<Goal, R> | undefined,
        ) => Promise<FieldsSelection<Goal, R> | undefined>;
    };
    createProject: (args: {
        description?: Scalars['String'] | null;
        flowId: Scalars['String'];
        ownerId: Scalars['String'];
        title: Scalars['String'];
        user: UserSession;
    }) => ProjectPromiseChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Promise<FieldsSelection<Project, R> | undefined>;
    };
    createTag: (args: {
        color: Scalars['String'];
        description?: Scalars['String'] | null;
        title: Scalars['String'];
        user: UserSession;
    }) => TagPromiseChain & {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: FieldsSelection<Tag, R> | undefined,
        ) => Promise<FieldsSelection<Tag, R> | undefined>;
    };
    inviteUser: (args: {
        email: Scalars['String'];
        user: UserSession;
    }) => GhostPromiseChain & {
        get: <R extends GhostRequest>(
            request: R,
            defaultValue?: FieldsSelection<Ghost, R> | undefined,
        ) => Promise<FieldsSelection<Ghost, R> | undefined>;
    };
}

export interface MutationObservableChain {
    createGoal: (args: {
        description: Scalars['String'];
        estimate?: GoalEstimate | null;
        key?: Scalars['Boolean'] | null;
        ownerId: Scalars['String'];
        personal?: Scalars['Boolean'] | null;
        private?: Scalars['Boolean'] | null;
        projectId: Scalars['Int'];
        stateId?: Scalars['String'] | null;
        tags?: Scalars['String'][] | null;
        title: Scalars['String'];
        user: UserSession;
    }) => GoalObservableChain & {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: FieldsSelection<Goal, R> | undefined,
        ) => Observable<FieldsSelection<Goal, R> | undefined>;
    };
    createProject: (args: {
        description?: Scalars['String'] | null;
        flowId: Scalars['String'];
        ownerId: Scalars['String'];
        title: Scalars['String'];
        user: UserSession;
    }) => ProjectObservableChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Observable<FieldsSelection<Project, R> | undefined>;
    };
    createTag: (args: {
        color: Scalars['String'];
        description?: Scalars['String'] | null;
        title: Scalars['String'];
        user: UserSession;
    }) => TagObservableChain & {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: FieldsSelection<Tag, R> | undefined,
        ) => Observable<FieldsSelection<Tag, R> | undefined>;
    };
    inviteUser: (args: {
        email: Scalars['String'];
        user: UserSession;
    }) => GhostObservableChain & {
        get: <R extends GhostRequest>(
            request: R,
            defaultValue?: FieldsSelection<Ghost, R> | undefined,
        ) => Observable<FieldsSelection<Ghost, R> | undefined>;
    };
}

export interface ProjectPromiseChain {
    computedOwner: UserAnyKindPromiseChain & {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: FieldsSelection<UserAnyKind, R> | undefined,
        ) => Promise<FieldsSelection<UserAnyKind, R> | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    description: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    flow: FlowPromiseChain & {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: FieldsSelection<Flow, R> | undefined,
        ) => Promise<FieldsSelection<Flow, R> | undefined>;
    };
    goals: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']> };
    owner: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    slug: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
}

export interface ProjectObservableChain {
    computedOwner: UserAnyKindObservableChain & {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: FieldsSelection<UserAnyKind, R> | undefined,
        ) => Observable<FieldsSelection<UserAnyKind, R> | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    description: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    flow: FlowObservableChain & {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: FieldsSelection<Flow, R> | undefined,
        ) => Observable<FieldsSelection<Flow, R> | undefined>;
    };
    goals: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']> };
    owner: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    slug: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    tags: {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
}

export interface QueryPromiseChain {
    findUserAnyKind: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: (FieldsSelection<UserAnyKind, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<UserAnyKind, R> | undefined)[] | undefined>;
    };
    flow: (args: {
        id: Scalars['String'];
    }) => FlowPromiseChain & {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: FieldsSelection<Flow, R> | undefined,
        ) => Promise<FieldsSelection<Flow, R> | undefined>;
    };
    flowCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    flowRecommended: {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    project: (args: {
        slug: Scalars['String'];
    }) => ProjectPromiseChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Promise<FieldsSelection<Project, R> | undefined>;
    };
    projectCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    projectGoals: (args: { slug: Scalars['String'] }) => {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    tagCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    users: ((args?: { sortBy?: SortOrder | null }) => {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: (FieldsSelection<User, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<User, R> | undefined)[] | undefined>;
    }) & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: (FieldsSelection<User, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<User, R> | undefined)[] | undefined>;
    };
}

export interface QueryObservableChain {
    findUserAnyKind: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends UserAnyKindRequest>(
            request: R,
            defaultValue?: (FieldsSelection<UserAnyKind, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<UserAnyKind, R> | undefined)[] | undefined>;
    };
    flow: (args: {
        id: Scalars['String'];
    }) => FlowObservableChain & {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: FieldsSelection<Flow, R> | undefined,
        ) => Observable<FieldsSelection<Flow, R> | undefined>;
    };
    flowCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    flowRecommended: {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    project: (args: {
        slug: Scalars['String'];
    }) => ProjectObservableChain & {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: FieldsSelection<Project, R> | undefined,
        ) => Observable<FieldsSelection<Project, R> | undefined>;
    };
    projectCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    projectGoals: (args: { slug: Scalars['String'] }) => {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    tagCompletion: (args: { query: Scalars['String']; sortBy?: SortOrder | null }) => {
        get: <R extends TagRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Tag, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Tag, R> | undefined)[] | undefined>;
    };
    users: ((args?: { sortBy?: SortOrder | null }) => {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: (FieldsSelection<User, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<User, R> | undefined)[] | undefined>;
    }) & {
        get: <R extends UserRequest>(
            request: R,
            defaultValue?: (FieldsSelection<User, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<User, R> | undefined)[] | undefined>;
    };
}

export interface StatePromiseChain {
    default: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Promise<Scalars['Boolean'] | undefined>;
    };
    flows: {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
}

export interface StateObservableChain {
    default: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['Boolean'] | undefined,
        ) => Observable<Scalars['Boolean'] | undefined>;
    };
    flows: {
        get: <R extends FlowRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Flow, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Flow, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
}

export interface TagPromiseChain {
    activity: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    activityId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    color: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    description: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    goals: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    projects: {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Promise<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
}

export interface TagObservableChain {
    activity: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    activityId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    color: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    description: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    goals: {
        get: <R extends GoalRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Goal, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Goal, R> | undefined)[] | undefined>;
    };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    projects: {
        get: <R extends ProjectRequest>(
            request: R,
            defaultValue?: (FieldsSelection<Project, R> | undefined)[] | undefined,
        ) => Observable<(FieldsSelection<Project, R> | undefined)[] | undefined>;
    };
    title: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
}

export interface UserPromiseChain {
    activity: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    activityId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
    email: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Promise<Scalars['String']> };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']> };
    image: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    name: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    role: { get: (request?: boolean | number, defaultValue?: Role) => Promise<Role> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>;
    };
}

export interface UserObservableChain {
    activity: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    activityId: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    createdAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
    email: { get: (request?: boolean | number, defaultValue?: Scalars['String']) => Observable<Scalars['String']> };
    id: { get: (request?: boolean | number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']> };
    image: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    name: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    role: { get: (request?: boolean | number, defaultValue?: Role) => Observable<Role> };
    updatedAt: {
        get: (request?: boolean | number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>;
    };
}

export interface UserAnyKindPromiseChain {
    activity: ActivityPromiseChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Promise<FieldsSelection<Activity, R> | undefined>;
    };
    email: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    id: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    image: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
    kind: { get: (request?: boolean | number, defaultValue?: UserKind | undefined) => Promise<UserKind | undefined> };
    name: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Promise<Scalars['String'] | undefined>;
    };
}

export interface UserAnyKindObservableChain {
    activity: ActivityObservableChain & {
        get: <R extends ActivityRequest>(
            request: R,
            defaultValue?: FieldsSelection<Activity, R> | undefined,
        ) => Observable<FieldsSelection<Activity, R> | undefined>;
    };
    email: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    id: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    image: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
    kind: {
        get: (request?: boolean | number, defaultValue?: UserKind | undefined) => Observable<UserKind | undefined>;
    };
    name: {
        get: (
            request?: boolean | number,
            defaultValue?: Scalars['String'] | undefined,
        ) => Observable<Scalars['String'] | undefined>;
    };
}
