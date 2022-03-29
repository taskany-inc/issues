import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { gql } from '../../utils/gql';
import { Header } from '../../components/Header';
import { Text, Card, Input, Textarea, Spacer, Button, useInput, Breadcrumbs } from '@geist-ui/core';
import { Icon } from '../../components/Icon';

const StyledDialogPage = styled.main`
    padding: 40px 20px;
`;

const StyledInput = styled(Input)`
    &.input-container .input-wrapper input {
        font-weight: 600;
    }
`;

function Page() {
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('teams.new');

    const { state: title, bindings: titleBindings } = useInput('');
    const { state: description, bindings: descriptionBindings } = useInput('');

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        await gql
            .mutation({
                createTeam: [
                    {
                        user: session!.user,
                        title,
                        description,
                    },
                    {
                        id: true,
                    },
                ],
            })
            .then((res) => {
                console.log(`Team ${res.createTeam?.id} created`);
                router.push('/');
            })
            .catch((error) => console.log(error.message));
    };

    return (
        <>
            <Head>
                <title>{t('title')}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <StyledDialogPage>
                <Breadcrumbs>
                    <Breadcrumbs.Item>
                        <Icon type="building" size="s" />
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>
                        <Icon type="plus" size="s" />
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>
                        <Text>{title}</Text>
                    </Breadcrumbs.Item>
                </Breadcrumbs>

                <Text h1>{t('Create new team')}</Text>

                <Card style={{ maxWidth: 800, textAlign: 'right' }}>
                    <form onSubmit={handleSubmit}>
                        <StyledInput
                            width="100%"
                            scale={1.4}
                            placeholder="Team's title"
                            name="title"
                            {...titleBindings}
                        />
                        <Spacer />
                        <Textarea
                            width="100%"
                            scale={1.4}
                            placeholder="And desctiption"
                            name="description"
                            {...descriptionBindings}
                        />
                        <Spacer />
                        <Button
                            ghost
                            type="success"
                            scale={0.8}
                            font={1.2}
                            style={{ fontWeight: 600 }}
                            htmlType="submit"
                            disabled={title === ''}
                        >
                            Create team
                        </Button>
                    </form>
                </Card>
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
