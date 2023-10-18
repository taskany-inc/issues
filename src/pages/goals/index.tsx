import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../utils/filters';

const pageSize = 20;

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { ssrHelpers } = props;

        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        if (queryState.groupBy === 'project') {
            await ssrHelpers.project.getAll.fetchInfinite({
                limit: pageSize,
                goalsQuery: queryState,
                firstLevel: !!queryState.project.length,
            });
        } else {
            await ssrHelpers.goal.getBatch.fetchInfinite({
                limit: pageSize,
                query: queryState,
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

export default GoalsPage;
