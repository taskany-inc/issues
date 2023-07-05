import { DashboardPage } from '../components/DashboardPage/DashboardPage';
import { filtersPanelSsrInit } from '../components/FiltersPanel/FiltersPanel';
import { parseFilterValues } from '../hooks/useUrlFilterParams';
import { declareSsrProps } from '../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async (params) => {
        filtersPanelSsrInit(params);

        const { query, ssrHelpers } = params;
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.filter.getUserFilters.fetch();
        await ssrHelpers.goal.getUserGoals.fetch(
            parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
        );
    },
    {
        private: true,
    },
);

export default DashboardPage;
