import { ExploreProjectsPage } from '../../components/ExploreProjectsPage/ExploreProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { parseFilterValues } from '../../hooks/useUrlFilterParams';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, query }) => {
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.project.getAll.fetch({
            firstLevel: true,
            goalsQuery: parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
        });
    },
    {
        private: true,
    },
);

export default ExploreProjectsPage;
