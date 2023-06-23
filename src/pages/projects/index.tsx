import { ProjectsPage } from '../../components/ProjectsPage/ProjectsPage';
import { parseFilterValues } from '../../hooks/useUrlFilterParams';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.project.getAll.fetch();
    },
    {
        private: true,
    },
);

export default ProjectsPage;
