import type { GetStaticPropsContext } from 'next';
import { useTranslations } from 'next-intl';

import { DialogPage } from '../../components/DialogPage';
import { CreateGoal } from '../../components/CreateGoal';
import { useRouter } from '../../hooks/router';

function Page() {
    const t = useTranslations('goals.new');
    const router = useRouter();

    return (
        <DialogPage title={t('title')} heading={t('Create new goal')}>
            <CreateGoal card onCreate={(id) => id && router.goal(id)} />
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
