import { ExploreProjectsPage } from '../../../components/ExploreProjectsPage/ExploreProjectsPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.v2.project.getAll.fetch({
            firstLevel: false,
            limit: 20,
        });
    },
    {
        private: true,
    },
);

export default ExploreProjectsPage;
