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
    UserMenu,
    nullable,
} from '@taskany/bricks';
import { gapM } from '@taskany/colors';

import { header, headerMenu, headerMenuExplore, headerMenuGoals, headerMenuProjects } from '../../utils/domObjects';
import { usePageContext } from '../../hooks/usePageContext';
import { routes, useRouter } from '../../hooks/router';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import { BetaBadge } from '../BetaBadge';

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

    const links: [{ href: string; title: string; beta?: boolean; attr?: { 'data-cy': string } }] = [
        {
            href: routes.exploreTopProjects(),
            title: tr('Explore'),
            attr: headerMenuExplore.attr,
        },
    ];

    if (user?.settings?.beta) {
        links.unshift(
            {
                href: routes.goals(),
                title: tr('Goals'),
                attr: headerMenuGoals.attr,
                beta: true,
            },
            {
                href: routes.projects(),
                title: tr('Projects'),
                beta: true,
                attr: headerMenuProjects.attr,
            },
        );
    }

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
                <StyledHeaderNav {...headerMenu.attr}>
                    {links.map(({ href, title, beta, attr }) => (
                        <NextLink href={href} passHref key={href} legacyBehavior>
                            <HeaderNavLink {...attr}>
                                {title}{' '}
                                {nullable(beta, () => (
                                    <BetaBadge />
                                ))}
                            </HeaderNavLink>
                        </NextLink>
                    ))}
                    <HeaderSearch>
                        <GlobalSearch />
                    </HeaderSearch>
                </StyledHeaderNav>
            }
            {...header.attr}
        >
            <HeaderContent>
                <PageHeaderActionButton />
            </HeaderContent>
        </Header>
    );
};
