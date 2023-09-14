import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback, redirect } = await filtersPanelSsrInit(props);

        if (redirect) {
            return redirect;
        }

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

export default ProjectPage;
