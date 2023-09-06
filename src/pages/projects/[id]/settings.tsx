import { ProjectSettingsPage } from '../../../components/ProjectSettingsPage/ProjectSettingsPage';
import { routes } from '../../../hooks/router';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, user, params: { id } }) => {
        const data = await ssrHelpers.project.getById.fetch({ id });

        if (!data) {
            return {
                notFound: true,
            };
        }

        if (user.role === 'USER' && !data._isOwner) {
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
