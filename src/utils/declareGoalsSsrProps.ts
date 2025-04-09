import { declareSsrProps } from './declareSsrProps';
import { filtersPanelSsrInit } from './filters';

const pageSize = 20;

export const declareGoalsSsrProps = () =>
    declareSsrProps(
        async (props) => {
            const { ssrHelpers } = props;
            const { queryState: urlQueryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

            const queryState = {
                ...urlQueryState,
            };

            if (queryState.groupBy === 'project') {
                await ssrHelpers.v2.project.getAll.fetchInfinite({
                    limit: pageSize,
                    goalsQuery: queryState,
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
            };
        },
        {
            private: true,
        },
    );
