import { router } from '../trpcBackend';

import { priority } from './priority';
import { filter } from './filter';
import { flow } from './flow';
import { user } from './user';
import { reaction } from './reaction';
import { tag } from './tag';
import { project } from './project';
import { goal } from './goal';
import { search } from './search';
import { state } from './state';
import { feedback } from './feedback';
import { whatsnew } from './whatsnew';
import { crew } from './crew';
import { appConfig } from './appConfig';
import { project as projectV2 } from './projectV2';
import { goal as goalV2 } from './goalV2';
import { jira } from './jira';

export const trpcRouter = router({
    filter,
    flow,
    user,
    reaction,
    tag,
    project,
    goal,
    search,
    state,
    feedback,
    whatsnew,
    priority,
    crew,
    appConfig,
    v2: router({
        project: projectV2,
        goal: goalV2,
    }),
    jira,
});

export type TrpcRouter = typeof trpcRouter;
