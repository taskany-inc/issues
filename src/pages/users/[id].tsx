import { useTranslations } from 'next-intl';

import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page } from '../../components/Page';

export const getServerSideProps = declareSsrProps(async () => ({}), {
    private: true,
});

const UserSettingsPage = ({ user, locale, params: { id } }: ExternalPageProps<null, { id: string }>) => {
    const t = useTranslations('users.settings');

    return (
        <Page user={user} locale={locale} title={user?.name || 'No name'}>
            Settings
        </Page>
    );
};

export default UserSettingsPage;
