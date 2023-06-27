import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { parseFilterValues } from '../../hooks/useUrlFilterParams';

const pageSize = 20;

export const getServerSideProps = declareSsrProps(
    async ({ query, ssrHelpers }) => {
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.goal.getBatch.fetchInfinite({
            limit: pageSize,
            query: parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
        });

        await ssrHelpers.filter.getUserFilters.fetch();
    },
    {
        private: true,
    },
);

export default GoalsPage;
