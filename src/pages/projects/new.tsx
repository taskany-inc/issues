import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';
import { Text, Grid } from '@geist-ui/core';

import { Header } from '../../components/Header';
import { CreateProject } from '../../components/CreateProject';

const StyledDialogPage = styled.main`
    padding: 40px 20px;
`;

const CleanFlexContainer = styled.div`
    width: 100%;
`;

function Page() {
    const t = useTranslations('projects.new');

    return (
        <>
            <Head>
                <title>{t('title')}</title>
            </Head>

            <Header />

            <StyledDialogPage>
                <Grid.Container gap={0}>
                    <Grid xs={1} />
                    <Grid xs={23}>
                        <CleanFlexContainer>
                            <Text h1>{t('Create new project')}</Text>
                            <CreateProject card />
                        </CleanFlexContainer>
                    </Grid>
                </Grid.Container>
            </StyledDialogPage>
        </>
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
