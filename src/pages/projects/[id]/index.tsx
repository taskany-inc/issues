import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ query, ssrHelpers }) => {
        if (typeof query.filter === 'string') {
            await ssrHelpers.filter.getById.fetch(query.filter);
        }

        return {
            fallback: {},
        };
    },
    {
        private: true,
    },
);

export default ProjectPage;
