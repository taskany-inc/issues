import { GoalsPage, goalsPageFetcher } from '../../components/GoalsPage/GoalsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { parseFilterValues } from '../../hooks/useUrlFilterParams';

export const getServerSideProps = declareSsrProps(
    async ({ user, query, ssrHelpers }) => {
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.filter.getUserFilters.fetch();

        const userGoals = await goalsPageFetcher(
            user,
            ...Object.values(
                parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
            ),
        );
        return {
            fallback: {
                ...userGoals,
            },
        };
    },
    {
        private: true,
    },
);

export default GoalsPage;
