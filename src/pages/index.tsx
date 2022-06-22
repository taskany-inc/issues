import { useTranslations } from 'next-intl';

import { declareSsrProps, ExternalPageProps } from '../utils/declareSsrProps';
import { Page } from '../components/Page';

export const getServerSideProps = declareSsrProps();

const HomePage = ({ locale }: ExternalPageProps) => {
    const t = useTranslations('index');

    return <Page locale={locale} title={t('title')}></Page>;
};

export default HomePage;
