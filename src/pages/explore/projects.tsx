import { ExploreProjectsPage, exploreProjectsFetcher } from '../../components/ExporeProjectsPage/ExporeProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        fallback: {
            'explore/projects': await exploreProjectsFetcher(user),
        },
    }),
    {
        private: true,
    },
);

export default ExploreProjectsPage;
