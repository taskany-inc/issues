import { createContext } from 'react';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';

export const ProjectContext = createContext<{ project: ProjectByIdReturnType }>({
    project: null,
});
