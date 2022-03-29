import { Session } from 'next-auth';

import { gql } from './gql';
import { QueryRequest } from '../../graphql/generated/genql';

export function createFetcher<T>(cb: (user: Session['user'], ...args: T[]) => QueryRequest) {
    return (user?: Session['user'], ...rest: T[]) => () => gql.query(cb(user!, ...rest));
}
