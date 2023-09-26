import { ProjectSettingsPage } from '../../../components/ProjectSettingsPage/ProjectSettingsPage';
import { routes } from '../../../hooks/router';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        const data = await ssrHelpers.project.getById.fetch({ id });

        if (!data) {
            return {
                notFound: true,
            };
        }

        if (!data._isEditable) {
            return {
                redirect: {
                    permanent: false,
                    destination: routes.project(data.id),
                },
            };
        }
    },
    {
        private: true,
    },
);

export default ProjectSettingsPage;
