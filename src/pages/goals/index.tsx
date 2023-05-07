import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { parseFilterValues } from '../../hooks/useUrlFilterParams';

export const getServerSideProps = declareSsrProps(
    async ({ query, ssrHelpers }) => {
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

export default GoalsPage;
