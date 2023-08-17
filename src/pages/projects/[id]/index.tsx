import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const goalsQuery = await filtersPanelSsrInit(props);

        const {
            params: { id },
            ssrHelpers,
        } = props;

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
