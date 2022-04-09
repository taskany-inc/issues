import {FieldsSelection,Observable} from '@genql/runtime'

export type Scalars = {
    ID: string,
    DateTime: any,
    String: string,
    Int: number,
    Boolean: boolean,
}

export interface Activity {
    created_at: Scalars['DateTime']
    id: Scalars['ID']
    updated_at: Scalars['DateTime']
    __typename: 'Activity'
}

export interface Ghost {
    activity?: Activity
    created_at: Scalars['DateTime']
    email: Scalars['String']
    host?: User
    host_id: Scalars['String']
    id: Scalars['ID']
    updated_at: Scalars['DateTime']
    user?: User
    __typename: 'Ghost'
}

export interface Mutation {
    createGhost?: Ghost
    createProject?: Project
    createTestUser?: User
    __typename: 'Mutation'
}

export interface Project {
    created_at: Scalars['DateTime']
    description?: Scalars['String']
    id: Scalars['Int']
    owner?: Activity
    owner_id?: Scalars['String']
    title: Scalars['String']
    updated_at: Scalars['DateTime']
    __typename: 'Project'
}

export interface Query {
    findGhost?: (Ghost | undefined)[]
    findUser?: (User | undefined)[]
    findUserAnyKind?: (UserAnyKind | undefined)[]
    projects?: (Project | undefined)[]
    users?: (User | undefined)[]
    __typename: 'Query'
}

export type Role = 'ADMIN' | 'USER'

export type SortOrder = 'asc' | 'desc'

export interface User {
    activity?: Activity
    activity_id?: Scalars['String']
    created_at: Scalars['DateTime']
    email: Scalars['String']
    id: Scalars['ID']
    image?: Scalars['String']
    name?: Scalars['String']
    role: Role
    updated_at: Scalars['DateTime']
    __typename: 'User'
}

export interface UserAnyKind {
    activity?: Activity
    email?: Scalars['String']
    id?: Scalars['String']
    image?: Scalars['String']
    kind?: UserKind
    name?: Scalars['String']
    __typename: 'UserAnyKind'
}

export type UserKind = 'GHOST' | 'USER'

export interface ActivityRequest{
    created_at?: boolean | number
    id?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface GhostRequest{
    activity?: ActivityRequest
    created_at?: boolean | number
    email?: boolean | number
    host?: UserRequest
    host_id?: boolean | number
    id?: boolean | number
    updated_at?: boolean | number
    user?: UserRequest
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MutationRequest{
    createGhost?: [{email: Scalars['String'],user: UserSession},GhostRequest]
    createProject?: [{description?: (Scalars['String'] | null),owner_id: Scalars['String'],title: Scalars['String'],user: UserSession},ProjectRequest]
    createTestUser?: [{email: Scalars['String']},UserRequest]
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ProjectRequest{
    created_at?: boolean | number
    description?: boolean | number
    id?: boolean | number
    owner?: ActivityRequest
    owner_id?: boolean | number
    title?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface QueryRequest{
    findGhost?: [{query: Scalars['String'],sortBy?: (SortOrder | null)},GhostRequest]
    findUser?: [{query: Scalars['String'],sortBy?: (SortOrder | null)},UserRequest]
    findUserAnyKind?: [{query: Scalars['String'],sortBy?: (SortOrder | null)},UserAnyKindRequest]
    projects?: [{sortBy?: (SortOrder | null)},ProjectRequest] | ProjectRequest
    users?: [{sortBy?: (SortOrder | null)},UserRequest] | UserRequest
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserRequest{
    activity?: ActivityRequest
    activity_id?: boolean | number
    created_at?: boolean | number
    email?: boolean | number
    id?: boolean | number
    image?: boolean | number
    name?: boolean | number
    role?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserAnyKindRequest{
    activity?: ActivityRequest
    email?: boolean | number
    id?: boolean | number
    image?: boolean | number
    kind?: boolean | number
    name?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserSession {email: Scalars['String'],id: Scalars['ID'],image?: (Scalars['String'] | null),name?: (Scalars['String'] | null),role: Role}


const Activity_possibleTypes = ['Activity']
export const isActivity = (obj?: { __typename?: any } | null): obj is Activity => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isActivity"')
  return Activity_possibleTypes.includes(obj.__typename)
}



const Ghost_possibleTypes = ['Ghost']
export const isGhost = (obj?: { __typename?: any } | null): obj is Ghost => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isGhost"')
  return Ghost_possibleTypes.includes(obj.__typename)
}



const Mutation_possibleTypes = ['Mutation']
export const isMutation = (obj?: { __typename?: any } | null): obj is Mutation => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isMutation"')
  return Mutation_possibleTypes.includes(obj.__typename)
}



const Project_possibleTypes = ['Project']
export const isProject = (obj?: { __typename?: any } | null): obj is Project => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isProject"')
  return Project_possibleTypes.includes(obj.__typename)
}



const Query_possibleTypes = ['Query']
export const isQuery = (obj?: { __typename?: any } | null): obj is Query => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isQuery"')
  return Query_possibleTypes.includes(obj.__typename)
}



const User_possibleTypes = ['User']
export const isUser = (obj?: { __typename?: any } | null): obj is User => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isUser"')
  return User_possibleTypes.includes(obj.__typename)
}



const UserAnyKind_possibleTypes = ['UserAnyKind']
export const isUserAnyKind = (obj?: { __typename?: any } | null): obj is UserAnyKind => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isUserAnyKind"')
  return UserAnyKind_possibleTypes.includes(obj.__typename)
}


export interface ActivityPromiseChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>})
}

export interface ActivityObservableChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>})
}

export interface GhostPromiseChain{
    activity: (ActivityPromiseChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Promise<(FieldsSelection<Activity, R> | undefined)>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    host: (UserPromiseChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Promise<(FieldsSelection<User, R> | undefined)>}),
    host_id: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    user: (UserPromiseChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Promise<(FieldsSelection<User, R> | undefined)>})
}

export interface GhostObservableChain{
    activity: (ActivityObservableChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Observable<(FieldsSelection<Activity, R> | undefined)>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    host: (UserObservableChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Observable<(FieldsSelection<User, R> | undefined)>}),
    host_id: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    user: (UserObservableChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Observable<(FieldsSelection<User, R> | undefined)>})
}

export interface MutationPromiseChain{
    createGhost: ((args: {email: Scalars['String'],user: UserSession}) => GhostPromiseChain & {get: <R extends GhostRequest>(request: R, defaultValue?: (FieldsSelection<Ghost, R> | undefined)) => Promise<(FieldsSelection<Ghost, R> | undefined)>}),
    createProject: ((args: {description?: (Scalars['String'] | null),owner_id: Scalars['String'],title: Scalars['String'],user: UserSession}) => ProjectPromiseChain & {get: <R extends ProjectRequest>(request: R, defaultValue?: (FieldsSelection<Project, R> | undefined)) => Promise<(FieldsSelection<Project, R> | undefined)>}),
    createTestUser: ((args: {email: Scalars['String']}) => UserPromiseChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Promise<(FieldsSelection<User, R> | undefined)>})
}

export interface MutationObservableChain{
    createGhost: ((args: {email: Scalars['String'],user: UserSession}) => GhostObservableChain & {get: <R extends GhostRequest>(request: R, defaultValue?: (FieldsSelection<Ghost, R> | undefined)) => Observable<(FieldsSelection<Ghost, R> | undefined)>}),
    createProject: ((args: {description?: (Scalars['String'] | null),owner_id: Scalars['String'],title: Scalars['String'],user: UserSession}) => ProjectObservableChain & {get: <R extends ProjectRequest>(request: R, defaultValue?: (FieldsSelection<Project, R> | undefined)) => Observable<(FieldsSelection<Project, R> | undefined)>}),
    createTestUser: ((args: {email: Scalars['String']}) => UserObservableChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Observable<(FieldsSelection<User, R> | undefined)>})
}

export interface ProjectPromiseChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    description: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']>}),
    owner: (ActivityPromiseChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Promise<(FieldsSelection<Activity, R> | undefined)>}),
    owner_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>})
}

export interface ProjectObservableChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    description: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']>}),
    owner: (ActivityObservableChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Observable<(FieldsSelection<Activity, R> | undefined)>}),
    owner_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>})
}

export interface QueryPromiseChain{
    findGhost: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends GhostRequest>(request: R, defaultValue?: ((FieldsSelection<Ghost, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Ghost, R> | undefined)[] | undefined)>}),
    findUser: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>}),
    findUserAnyKind: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends UserAnyKindRequest>(request: R, defaultValue?: ((FieldsSelection<UserAnyKind, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<UserAnyKind, R> | undefined)[] | undefined)>}),
    projects: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends ProjectRequest>(request: R, defaultValue?: ((FieldsSelection<Project, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Project, R> | undefined)[] | undefined)>})&({get: <R extends ProjectRequest>(request: R, defaultValue?: ((FieldsSelection<Project, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Project, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface QueryObservableChain{
    findGhost: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends GhostRequest>(request: R, defaultValue?: ((FieldsSelection<Ghost, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Ghost, R> | undefined)[] | undefined)>}),
    findUser: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>}),
    findUserAnyKind: ((args: {query: Scalars['String'],sortBy?: (SortOrder | null)}) => {get: <R extends UserAnyKindRequest>(request: R, defaultValue?: ((FieldsSelection<UserAnyKind, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<UserAnyKind, R> | undefined)[] | undefined)>}),
    projects: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends ProjectRequest>(request: R, defaultValue?: ((FieldsSelection<Project, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Project, R> | undefined)[] | undefined)>})&({get: <R extends ProjectRequest>(request: R, defaultValue?: ((FieldsSelection<Project, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Project, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface UserPromiseChain{
    activity: (ActivityPromiseChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Promise<(FieldsSelection<Activity, R> | undefined)>}),
    activity_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: Role) => Promise<Role>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>})
}

export interface UserObservableChain{
    activity: (ActivityObservableChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Observable<(FieldsSelection<Activity, R> | undefined)>}),
    activity_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: Role) => Observable<Role>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>})
}

export interface UserAnyKindPromiseChain{
    activity: (ActivityPromiseChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Promise<(FieldsSelection<Activity, R> | undefined)>}),
    email: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    kind: ({get: (request?: boolean|number, defaultValue?: (UserKind | undefined)) => Promise<(UserKind | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>})
}

export interface UserAnyKindObservableChain{
    activity: (ActivityObservableChain & {get: <R extends ActivityRequest>(request: R, defaultValue?: (FieldsSelection<Activity, R> | undefined)) => Observable<(FieldsSelection<Activity, R> | undefined)>}),
    email: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    kind: ({get: (request?: boolean|number, defaultValue?: (UserKind | undefined)) => Observable<(UserKind | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>})
}