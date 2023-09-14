import { ProjectsPage, projectsSize } from '../../components/ProjectsPage/ProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback, redirect } = await filtersPanelSsrInit(props);

        if (redirect) {
            return redirect;
        }

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
