import { UserSettingsPage } from '../../components/UserSettingsPage/UserSettingsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.user.settings.fetch();
    },
    {
        private: true,
    },
);

export default UserSettingsPage;
