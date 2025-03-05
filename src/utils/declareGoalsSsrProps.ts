import { declareSsrProps } from './declareSsrProps';
import { filtersPanelSsrInit } from './filters';
import { QueryState } from './parseUrlParams';

const pageSize = 20;

export const declareGoalsSsrProps = (baseQueryState: Partial<QueryState> = {}) =>
    declareSsrProps(
        async (props) => {
            const { ssrHelpers } = props;
            const { queryState: urlQueryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

            const queryState = {
                ...urlQueryState,
                ...baseQueryState,
            };

            if (queryState.groupBy === 'project') {
                await ssrHelpers.v2.project.getAll.fetchInfinite({
                    limit: pageSize,
                    goalsQuery: queryState,
                    firstLevel: !queryState.project?.length,
                });
            } else {
                await ssrHelpers.v2.goal.getAllGoals.fetchInfinite({
                    limit: pageSize,
                    goalsQuery: queryState,
                });
            }

            await ssrHelpers.goal.getGoalsCount.fetch({
                query: queryState,
            });

            return {
                defaultPresetFallback,
                baseQueryState,
            };
        },
        {
            private: true,
        },
    );
