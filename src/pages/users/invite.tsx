import type { GetStaticPropsContext } from 'next';
import { useTranslations } from 'next-intl';

import { DialogPage } from '../../components/DialogPage';
import { InviteUser } from '../../components/InviteUser';

function Page() {
    const t = useTranslations('users.invite');

    return (
        <DialogPage title={t('title')} heading={t('Invite new user')}>
            <InviteUser card />
        </DialogPage>
    );
}

Page.auth = true;

export default Page;

export async function getStaticProps({ locale }: GetStaticPropsContext) {
    return {
        props: {
            i18n: (await import(`../../../i18n/${locale}.json`)).default,
        },
    };
}
