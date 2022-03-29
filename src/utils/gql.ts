import { createClient } from '../../graphql/generated/genql';

export const gql = createClient({
    url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/graphql`,
});
