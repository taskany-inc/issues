import { filtersPanelSsrInit } from '../../../components/FiltersPanel/FiltersPanel';
import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { parseFilterValues } from '../../../hooks/useUrlFilterParams';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        filtersPanelSsrInit(props);

        const {
            params: { id },
            query,
            ssrHelpers,
        } = props;
        const preset =
            typeof query.filter === 'string' ? await ssrHelpers.filter.getById.fetch(query.filter) : undefined;
        await ssrHelpers.filter.getUserFilters.fetch();
        const goalsQuery = parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query);
        const project = await ssrHelpers.project.getById.fetch({ id, goalsQuery });
        await ssrHelpers.project.getDeepInfo.fetch({
            id,
            goalsQuery,
        });

        if (!project) {
            return {
                notFound: true,
            };
        }
    },
    {
        private: true,
    },
);

export default ProjectPage;
