import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../utils/filters';

const pageSize = 20;

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { ssrHelpers } = props;

        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        await ssrHelpers.goal.getBatch.fetchInfinite({
            limit: pageSize,
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
