import {
    ExploreTopProjectsPage,
    exploreTopProjectsFetcher,
} from '../../components/ExploreTopProjectsPage/ExploreTopProjectsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        fallback: {
            'explore/projects': await exploreTopProjectsFetcher(user),
        },
    }),
    {
        private: true,
    },
);

export default ExploreTopProjectsPage;
