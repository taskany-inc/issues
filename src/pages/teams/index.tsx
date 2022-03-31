import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../../utils/createFetcher';
import { Header } from '../../components/Header';

const fetcher = createFetcher(() => ({
    teams: {
        id: true,
        title: true,
        description: true,
        // owner: {
        //     id: true,
        //     name: true,
        //     email: true,
        // },
        created_at: true,
    },
}));

const Page = () => {
    const { data: session } = useSession();
    const { data, error } = useSWR('teams', fetcher());
    const t = useTranslations('index');

    return (
        <>
            <Head>
                <title>{t('title')}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            {data?.teams ? (
                <div>{data?.teams && data.teams.map((team) => <div key={team.id}>{JSON.stringify(team)}</div>)}</div>
            ) : null}
        </>
    );
};

Page.auth = true;

export default Page;

export async function getStaticProps({ locale }: GetStaticPropsContext) {
    return {
        props: {
            i18n: (await import(`../../../i18n/${locale}.json`)).default,
        },
    };
}
