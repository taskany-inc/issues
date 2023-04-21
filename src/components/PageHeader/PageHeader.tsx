import { FC, useCallback } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import {
    Header,
    HeaderContent,
    HeaderLogo,
    HeaderMenu,
    HeaderNav,
    HeaderNavLink,
    SearchIcon,
    UserMenu,
} from '@taskany/bricks';
import { gray7 } from '@taskany/colors';

import { usePageContext } from '../../hooks/usePageContext';
import { routes, useRouter } from '../../hooks/router';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { PageHeaderLogo } from '../PageHeaderLogo';

import { tr } from './PageHeader.i18n';

const HeaderSearch = styled.div`
    position: relative;
    display: inline-block;
    margin-left: 30px;
    top: 3px;
`;

export const PageHeader: FC = () => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();

    const links = [
        {
            href: routes.goals(),
            title: tr('Goals'),
        },
        // {
        //     href: '',
        //     title: t('Issues'),
        // },
        // {
        //     href: '',
        //     title: t('Boards'),
        // },
        {
            href: routes.exploreProjects(),
            title: tr('Explore'),
        },
    ];

    const onUserMenuClick = useCallback(() => {
        if (user) {
            userSettings();
        } else {
            signIn();
        }
    }, [user, userSettings, signIn]);

    return (
        <Header
            logo={
                <HeaderLogo>
                    <PageHeaderLogo />
                </HeaderLogo>
            }
            menu={
                <HeaderMenu>
                    <UserMenu
                        onClick={onUserMenuClick}
                        avatar={user?.image || undefined} // TODO: понять суть бытия
                        email={user?.email || undefined}
                    />
                </HeaderMenu>
            }
            nav={
                <HeaderNav>
                    {links.map(({ href, title }, i) => (
                        <NextLink href={href} passHref key={i}>
                            <HeaderNavLink>{title}</HeaderNavLink>
                        </NextLink>
                    ))}
                    <HeaderSearch>
                        <SearchIcon size="s" color={gray7} />
                    </HeaderSearch>
                </HeaderNav>
            }
        >
            <HeaderContent>
                <PageHeaderActionButton />
            </HeaderContent>
        </Header>
    );
};
