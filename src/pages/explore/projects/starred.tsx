import { ExploreProjectsStarredPage } from '../../../components/ExploreProjectsStarredPage/ExploreProjectsStarredPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.project.getStarred.fetch();
    },
    {
        private: true,
    },
);

export default ExploreProjectsStarredPage;
