import { ProjectSettingsPage, projectsFetcher } from '../../../components/ProjectSettingsPage/ProjectSettingsPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => {
        const ssrData = await projectsFetcher(user, id);

        return ssrData.project
            ? {
                  fallback: {
                      [id]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export default ProjectSettingsPage;
