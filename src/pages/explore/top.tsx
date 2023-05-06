import { ExploreProjectsPage } from '../../components/ExporeProjectsPage/ExporeProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.project.getTop.fetch();
    },
    {
        private: true,
    },
);

export default ExploreProjectsPage;
