import type { GetStaticPropsContext } from 'next';
import { useTranslations } from 'next-intl';

import { DialogPage } from '../../components/DialogPage';
import { ProjectCreateForm } from '../../components/ProjectCreateForm';
import { useRouter } from '../../hooks/router';

function Page() {
    const t = useTranslations('projects.new');
    const router = useRouter();

    return (
        <DialogPage title={t('title')}>
            <ProjectCreateForm card onCreate={(key) => key && router.project(key)} />
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
