import {FieldsSelection,Observable} from '@genql/runtime'

export type Scalars = {
    DateTime: any,
    String: string,
    Int: number,
    ID: string,
    Boolean: boolean,
}

export interface Mutation {
    createTeam?: Team
    __typename: 'Mutation'
}

export interface Query {
    teams?: (Team | undefined)[]
    users?: (User | undefined)[]
    __typename: 'Query'
}

export type Role = 'ADMIN' | 'USER'

export type SortOrder = 'asc' | 'desc'

export interface Team {
    created_at: Scalars['DateTime']
    description?: Scalars['String']
    id: Scalars['Int']
    owner?: User
    owner_id?: Scalars['String']
    title: Scalars['String']
    updated_at: Scalars['DateTime']
    __typename: 'Team'
}

export interface User {
    created_at: Scalars['DateTime']
    email: Scalars['String']
    id: Scalars['ID']
    image?: Scalars['String']
    name?: Scalars['String']
    role: Role
    updated_at: Scalars['DateTime']
    __typename: 'User'
}

export interface MutationRequest{
    createTeam?: [{description?: (Scalars['String'] | null),title: Scalars['String'],user: UserSession},TeamRequest]
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface QueryRequest{
    teams?: [{sortBy?: (SortOrder | null)},TeamRequest] | TeamRequest
    users?: [{sortBy?: (SortOrder | null)},UserRequest] | UserRequest
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface TeamRequest{
    created_at?: boolean | number
    description?: boolean | number
    id?: boolean | number
    owner?: UserRequest
    owner_id?: boolean | number
    title?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserRequest{
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

export interface UserSession {email: Scalars['String'],id: Scalars['ID'],image?: (Scalars['String'] | null),name?: (Scalars['String'] | null),role: Role}


const Mutation_possibleTypes = ['Mutation']
export const isMutation = (obj?: { __typename?: any } | null): obj is Mutation => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isMutation"')
  return Mutation_possibleTypes.includes(obj.__typename)
}



const Query_possibleTypes = ['Query']
export const isQuery = (obj?: { __typename?: any } | null): obj is Query => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isQuery"')
  return Query_possibleTypes.includes(obj.__typename)
}



const Team_possibleTypes = ['Team']
export const isTeam = (obj?: { __typename?: any } | null): obj is Team => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isTeam"')
  return Team_possibleTypes.includes(obj.__typename)
}



const User_possibleTypes = ['User']
export const isUser = (obj?: { __typename?: any } | null): obj is User => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isUser"')
  return User_possibleTypes.includes(obj.__typename)
}


export interface MutationPromiseChain{
    createTeam: ((args: {description?: (Scalars['String'] | null),title: Scalars['String'],user: UserSession}) => TeamPromiseChain & {get: <R extends TeamRequest>(request: R, defaultValue?: (FieldsSelection<Team, R> | undefined)) => Promise<(FieldsSelection<Team, R> | undefined)>})
}

export interface MutationObservableChain{
    createTeam: ((args: {description?: (Scalars['String'] | null),title: Scalars['String'],user: UserSession}) => TeamObservableChain & {get: <R extends TeamRequest>(request: R, defaultValue?: (FieldsSelection<Team, R> | undefined)) => Observable<(FieldsSelection<Team, R> | undefined)>})
}

export interface QueryPromiseChain{
    teams: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends TeamRequest>(request: R, defaultValue?: ((FieldsSelection<Team, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Team, R> | undefined)[] | undefined)>})&({get: <R extends TeamRequest>(request: R, defaultValue?: ((FieldsSelection<Team, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Team, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface QueryObservableChain{
    teams: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends TeamRequest>(request: R, defaultValue?: ((FieldsSelection<Team, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Team, R> | undefined)[] | undefined)>})&({get: <R extends TeamRequest>(request: R, defaultValue?: ((FieldsSelection<Team, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Team, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface TeamPromiseChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    description: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']>}),
    owner: (UserPromiseChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Promise<(FieldsSelection<User, R> | undefined)>}),
    owner_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>})
}

export interface TeamObservableChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    description: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']>}),
    owner: (UserObservableChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Observable<(FieldsSelection<User, R> | undefined)>}),
    owner_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>})
}

export interface UserPromiseChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Promise<Scalars['ID']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: Role) => Promise<Role>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Promise<Scalars['DateTime']>})
}

export interface UserObservableChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['ID']) => Observable<Scalars['ID']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: Role) => Observable<Role>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: Scalars['DateTime']) => Observable<Scalars['DateTime']>})
}