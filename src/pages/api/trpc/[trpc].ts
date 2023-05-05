import * as trpcNext from '@trpc/server/adapters/next';

import { trpcRouter } from '../../../../trpc/router';
import { createContext } from '../../../../trpc/context';

export default trpcNext.createNextApiHandler({
    router: trpcRouter,
    createContext,
});
