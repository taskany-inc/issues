import { ExploreProjectsPage } from '../../../components/ExploreProjectsPage/ExploreProjectsPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.project.getAll.fetch();
    },
    {
        private: true,
    },
);

export default ExploreProjectsPage;
