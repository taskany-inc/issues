import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { Page } from '../../Page';

export const getServerSideProps = declareSsrProps(async () => ({}), {
    private: true,
});

export const UserPage = ({ user, ssrTime, locale, params: { id } }: ExternalPageProps<{ id: string }>) => {
    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={user?.name || 'No name'}>
            Settings
        </Page>
    );
};
