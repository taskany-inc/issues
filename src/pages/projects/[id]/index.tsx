import { ProjectsPage } from '../../../components/ProjectsPage/ProjectsPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        const {
            params: { id },
            ssrHelpers,
        } = props;

        const project = await ssrHelpers.project.getById.fetch({ id, goalsQuery: queryState });

        await ssrHelpers.project.getDeepInfo.fetch({
            id,
            goalsQuery: queryState,
        });

        if (!project) {
            return {
                notFound: true,
            };
        }

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default ProjectsPage;
