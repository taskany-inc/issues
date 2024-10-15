import { createContext } from 'react';

import { ProjectByIdReturnTypeV2 } from '../../../trpc/inferredTypes';

export const ProjectContext = createContext<{ project?: ProjectByIdReturnTypeV2 | null }>({
    project: null,
});
