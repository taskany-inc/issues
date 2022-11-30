import { useTranslations } from 'next-intl';

import { declareSsrProps, ExternalPageProps } from '../utils/declareSsrProps';
import { Page } from '../components/Page';

export const getServerSideProps = declareSsrProps();

const HomePage = ({ user, ssrTime, locale }: ExternalPageProps) => {
    const t = useTranslations('index');

    return <Page user={user} locale={locale} ssrTime={ssrTime} title={t('title')} />;
};

export default HomePage;
