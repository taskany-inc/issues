import { QueryState } from './parseUrlParams';
import { SSRProps } from './declareSsrProps';
import { getIsStateShown } from './getShownStates';

export const filtersTakeCount = 5;

export const projectCollapsableItemInit = async <T extends { id: string; partnerProjectIds?: string[] }>({
    project,
    queryState,
    params,
}: {
    project: T;
    queryState: QueryState;
    params: SSRProps;
}) => {
    const { ssrHelpers } = params;

    if (queryState.view === 'kanban') {
        const states = await ssrHelpers.state.all.fetch();

        if (project) {
            await Promise.all(
                states.map((state) => {
                    if (getIsStateShown(state, queryState)) {
                        return ssrHelpers.v2.project.getProjectGoalsById.fetchInfinite({
                            id: project.id,
                            goalsQuery: {
                                ...queryState,
                                partnershipProject: project.partnerProjectIds || undefined,
                                state: [state.id],
                            },
                        });
                    }
                    return Promise.resolve();
                }),
            );
        }
    } else {
        await ssrHelpers.v2.project.getProjectGoalsById.fetchInfinite({
            id: project.id,
            goalsQuery: {
                ...queryState,
                partnershipProject: project.partnerProjectIds ?? undefined,
            },
        });
    }
};
