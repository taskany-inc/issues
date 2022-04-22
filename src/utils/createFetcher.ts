import { Session } from 'next-auth';

import { QueryRequest } from '../../graphql/@generated/genql';

import { gql } from './gql';

export function createFetcher<T>(cb: (user: Session['user'], ...args: T[]) => QueryRequest) {
    return (user?: Session['user'], ...rest: T[]) => gql.query(cb(user!, ...rest));
}
