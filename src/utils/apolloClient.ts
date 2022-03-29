import { ApolloClient, InMemoryCache } from '@apollo/client';

export const apolloClient = new ApolloClient({
    uri: '/api/gql',
    cache: new InMemoryCache(),
});
