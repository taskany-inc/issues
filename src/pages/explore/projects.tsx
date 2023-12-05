import { ExploreProjectsPage } from '../../components/ExploreProjectsPage/ExploreProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { parseQueryState } from '../../hooks/useUrlFilterParams';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, query }) => {
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;

        await ssrHelpers.project.getAll.fetch({
            firstLevel: true,
            includePersonal: true,
            goalsQuery: parseQueryState(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query)
                .queryState,
        });
    },
    {
        private: true,
    },
);

export default ExploreProjectsPage;
