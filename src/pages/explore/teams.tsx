import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Team } from '../../../graphql/@generated/genql';
import { PageContent } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { TeamListItem } from '../../components/TeamListItem';
import { nullable } from '../../utils/nullable';
import { ExplorePageLayout } from '../../components/ExplorePageLayout';

const refreshInterval = 3000;

const fetcher = createFetcher(() => ({
    teams: [
        {
            data: {},
        },
        {
            id: true,
            slug: true,
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

const ExploreTeamsPage = ({ user, locale, ssrTime, ssrData }: ExternalPageProps<{ teams: Team[] }>) => {
    const t = useTranslations('explore');

    const { data } = useSWR([user], (...args) => fetcher(...args), {
        refreshInterval,
    });
    const teams: Team[] | null = data?.teams ?? ssrData.teams;

    return (
        <ExplorePageLayout user={user} locale={locale} ssrTime={ssrTime} title={t('teams.title')}>
            <PageSep />

            <PageContent>
                {teams?.map((team) =>
                    nullable(team, (te) => (
                        <TeamListItem
                            key={te.id}
                            slug={te.slug}
                            title={te.title}
                            description={te.description}
                            owner={te.activity}
                        />
                    )),
                )}
            </PageContent>
        </ExplorePageLayout>
    );
};

export default ExploreTeamsPage;
