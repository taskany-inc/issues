import { State } from '../../trpc/inferredTypes';

import { QueryState } from './parseUrlParams';

export const getIsStateShown = (state: State, queryState?: QueryState) => {
    const hasState = queryState?.state?.some((id) => id === state.id);
    const hasStateType = queryState?.stateType?.some((stateType) => stateType === state.type);
    const filtersEmpty = !queryState?.state?.length && !queryState?.stateType?.length;

    return filtersEmpty || hasState || hasStateType;
};
