import { UserSettingsPage, userSettingsFetcher } from '../../components/UserSettingsPage/UserSettingsPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        fallback: {
            [user.activityId]: await userSettingsFetcher(user),
        },
    }),
    {
        private: true,
    },
);

export default UserSettingsPage;
