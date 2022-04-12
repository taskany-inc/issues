import type { GetStaticPropsContext } from 'next';
import { useTranslations } from 'next-intl';

import { DialogPage } from '../../components/DialogPage';
import { CreateProject } from '../../components/CreateProject';
import { useRouter } from '../../hooks/router';

function Page() {
    const t = useTranslations('projects.new');
    const router = useRouter();

    return (
        <DialogPage title={t('title')} heading={t('Create new project')}>
            <CreateProject card onCreate={(slug) => slug && router.project(slug)} />
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
