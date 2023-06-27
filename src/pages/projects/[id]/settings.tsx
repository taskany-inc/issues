import { ProjectSettingsPage } from '../../../components/ProjectSettingsPage/ProjectSettingsPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        const data = await ssrHelpers.project.getById.fetch({ id });

        if (!data) {
            return {
                notFound: true,
            };
        }
    },
    {
        private: true,
    },
);

export default ProjectSettingsPage;
