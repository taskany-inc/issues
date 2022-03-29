import {FieldsSelection,Observable} from '@genql/runtime'

export type Scalars = {
    DateTime: any,
    String: string,
    Int: number,
    Boolean: boolean,
}

export interface Mutation {
    createPost?: Post
    __typename: 'Mutation'
}

export interface Post {
    author?: User
    author_id?: Scalars['String']
    content: Scalars['String']
    created_at?: Scalars['DateTime']
    id: Scalars['Int']
    title: Scalars['String']
    updated_at?: Scalars['DateTime']
    __typename: 'Post'
}

export interface Query {
    post?: Post
    posts?: (Post | undefined)[]
    users?: (User | undefined)[]
    __typename: 'Query'
}

export type Role = 'ADMIN' | 'USER'

export type SortOrder = 'asc' | 'desc'

export interface User {
    created_at?: Scalars['DateTime']
    email: Scalars['String']
    id: Scalars['String']
    image?: Scalars['String']
    name?: Scalars['String']
    posts?: (Post | undefined)[]
    role?: Role
    updated_at?: Scalars['DateTime']
    __typename: 'User'
}

export interface MutationRequest{
    createPost?: [{content: Scalars['String'],title: Scalars['String'],user: UserSession},PostRequest]
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PostRequest{
    author?: UserRequest
    author_id?: boolean | number
    content?: boolean | number
    created_at?: boolean | number
    id?: boolean | number
    title?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface QueryRequest{
    post?: [{id: Scalars['String'],user: UserSession},PostRequest]
    posts?: [{sortBy?: (SortOrder | null),user: UserSession},PostRequest]
    users?: [{sortBy?: (SortOrder | null)},UserRequest] | UserRequest
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserRequest{
    created_at?: boolean | number
    email?: boolean | number
    id?: boolean | number
    image?: boolean | number
    name?: boolean | number
    posts?: PostRequest
    role?: boolean | number
    updated_at?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserSession {email: Scalars['String'],id: Scalars['String'],image?: (Scalars['String'] | null),name?: (Scalars['String'] | null),role?: (Role | null)}


const Mutation_possibleTypes = ['Mutation']
export const isMutation = (obj?: { __typename?: any } | null): obj is Mutation => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isMutation"')
  return Mutation_possibleTypes.includes(obj.__typename)
}



const Post_possibleTypes = ['Post']
export const isPost = (obj?: { __typename?: any } | null): obj is Post => {
  if (!obj?.__typename) throw new Error('__typename is missing in "isPost"')
  return Post_possibleTypes.includes(obj.__typename)
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


export interface MutationPromiseChain{
    createPost: ((args: {content: Scalars['String'],title: Scalars['String'],user: UserSession}) => PostPromiseChain & {get: <R extends PostRequest>(request: R, defaultValue?: (FieldsSelection<Post, R> | undefined)) => Promise<(FieldsSelection<Post, R> | undefined)>})
}

export interface MutationObservableChain{
    createPost: ((args: {content: Scalars['String'],title: Scalars['String'],user: UserSession}) => PostObservableChain & {get: <R extends PostRequest>(request: R, defaultValue?: (FieldsSelection<Post, R> | undefined)) => Observable<(FieldsSelection<Post, R> | undefined)>})
}

export interface PostPromiseChain{
    author: (UserPromiseChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Promise<(FieldsSelection<User, R> | undefined)>}),
    author_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    content: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Promise<(Scalars['DateTime'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Promise<Scalars['Int']>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Promise<(Scalars['DateTime'] | undefined)>})
}

export interface PostObservableChain{
    author: (UserObservableChain & {get: <R extends UserRequest>(request: R, defaultValue?: (FieldsSelection<User, R> | undefined)) => Observable<(FieldsSelection<User, R> | undefined)>}),
    author_id: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    content: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    created_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Observable<(Scalars['DateTime'] | undefined)>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['Int']) => Observable<Scalars['Int']>}),
    title: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Observable<(Scalars['DateTime'] | undefined)>})
}

export interface QueryPromiseChain{
    post: ((args: {id: Scalars['String'],user: UserSession}) => PostPromiseChain & {get: <R extends PostRequest>(request: R, defaultValue?: (FieldsSelection<Post, R> | undefined)) => Promise<(FieldsSelection<Post, R> | undefined)>}),
    posts: ((args: {sortBy?: (SortOrder | null),user: UserSession}) => {get: <R extends PostRequest>(request: R, defaultValue?: ((FieldsSelection<Post, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Post, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface QueryObservableChain{
    post: ((args: {id: Scalars['String'],user: UserSession}) => PostObservableChain & {get: <R extends PostRequest>(request: R, defaultValue?: (FieldsSelection<Post, R> | undefined)) => Observable<(FieldsSelection<Post, R> | undefined)>}),
    posts: ((args: {sortBy?: (SortOrder | null),user: UserSession}) => {get: <R extends PostRequest>(request: R, defaultValue?: ((FieldsSelection<Post, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Post, R> | undefined)[] | undefined)>}),
    users: ((args?: {sortBy?: (SortOrder | null)}) => {get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})&({get: <R extends UserRequest>(request: R, defaultValue?: ((FieldsSelection<User, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<User, R> | undefined)[] | undefined)>})
}

export interface UserPromiseChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Promise<(Scalars['DateTime'] | undefined)>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Promise<Scalars['String']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Promise<(Scalars['String'] | undefined)>}),
    posts: ({get: <R extends PostRequest>(request: R, defaultValue?: ((FieldsSelection<Post, R> | undefined)[] | undefined)) => Promise<((FieldsSelection<Post, R> | undefined)[] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: (Role | undefined)) => Promise<(Role | undefined)>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Promise<(Scalars['DateTime'] | undefined)>})
}

export interface UserObservableChain{
    created_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Observable<(Scalars['DateTime'] | undefined)>}),
    email: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    id: ({get: (request?: boolean|number, defaultValue?: Scalars['String']) => Observable<Scalars['String']>}),
    image: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    name: ({get: (request?: boolean|number, defaultValue?: (Scalars['String'] | undefined)) => Observable<(Scalars['String'] | undefined)>}),
    posts: ({get: <R extends PostRequest>(request: R, defaultValue?: ((FieldsSelection<Post, R> | undefined)[] | undefined)) => Observable<((FieldsSelection<Post, R> | undefined)[] | undefined)>}),
    role: ({get: (request?: boolean|number, defaultValue?: (Role | undefined)) => Observable<(Role | undefined)>}),
    updated_at: ({get: (request?: boolean|number, defaultValue?: (Scalars['DateTime'] | undefined)) => Observable<(Scalars['DateTime'] | undefined)>})
}