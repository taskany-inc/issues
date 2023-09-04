import { ProjectsPage, projectsSize } from '../../components/ProjectsPage/ProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        const { ssrHelpers } = props;

        await ssrHelpers.project.getAll.fetchInfinite({
            limit: projectsSize,
            firstLevel: true,
            goalsQuery: queryState,
        });

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default ProjectsPage;
