import { FC, useCallback } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { Header, HeaderContent, HeaderLogo, HeaderMenu, HeaderNav, HeaderNavLink, UserMenu } from '@taskany/bricks';
import { gapM } from '@taskany/colors';

import { usePageContext } from '../../hooks/usePageContext';
import { routes, useRouter } from '../../hooks/router';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';

import { tr } from './PageHeader.i18n';

const HeaderSearch = styled.div`
    margin-left: ${gapM};
`;

const StyledHeaderNav = styled(HeaderNav)`
    display: flex;
    align-items: center;
`;

export const PageHeader: FC = () => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();

    const links = [
        {
            href: routes.goals(),
            title: tr('Goals'),
        },
        {
            href: routes.exploreTopProjects(),
            title: tr('Explore'),
        },
    ];

    const onUserMenuClick = useCallback(() => (user ? userSettings() : signIn()), [user, userSettings, signIn]);

    return (
        <Header
            logo={
                <HeaderLogo>
                    <PageHeaderLogo />
                </HeaderLogo>
            }
            menu={
                <HeaderMenu>
                    <UserMenu onClick={onUserMenuClick} avatar={user?.image} email={user?.email} />
                </HeaderMenu>
            }
            nav={
                <StyledHeaderNav>
                    {links.map(({ href, title }) => (
                        <NextLink href={href} passHref key={href}>
                            <HeaderNavLink>{title}</HeaderNavLink>
                        </NextLink>
                    ))}
                    <HeaderSearch>
                        <GlobalSearch />
                    </HeaderSearch>
                </StyledHeaderNav>
            }
        >
            <HeaderContent>
                <PageHeaderActionButton />
            </HeaderContent>
        </Header>
    );
};
