import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher, refreshInterval } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { TeamListItem } from '../../components/TeamListItem';
import { nullable } from '../../utils/nullable';
import { ExplorePageLayout } from '../../components/ExplorePageLayout';

const fetcher = createFetcher(() => ({
    teams: [
        {
            data: {},
        },
        {
            id: true,
            key: true,
            title: true,
            description: true,
            projects: {
                id: true,
            },
            activity: {
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        ssrData: await fetcher(user),
    }),
    {
        private: true,
    },
);

const ExploreTeamsPage = ({
    user,
    locale,
    ssrTime,
    ssrData: fallbackData,
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>>) => {
    const t = useTranslations('explore');

    const { data } = useSWR([user], (...args) => fetcher(...args), {
        refreshInterval,
        fallbackData,
    });
    const teams = data?.teams;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={t('teams.title')}>
            <ExplorePageLayout>
                <PageSep />

                <PageContent>
                    {teams?.map((team) => nullable(team, (te) => <TeamListItem key={te.id} team={te} />))}
                </PageContent>
            </ExplorePageLayout>
        </Page>
    );
};

export default ExploreTeamsPage;
