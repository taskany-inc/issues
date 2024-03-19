import { ComponentProps, FC, useCallback } from 'react';
import NextLink from 'next/link';
import { Header, HeaderContent, HeaderLogo, HeaderMenu, HeaderNav, HeaderNavLink, UserMenu } from '@taskany/bricks';

import { header, headerMenu, headerMenuExplore, headerMenuGoals } from '../../utils/domObjects';
import { usePageContext } from '../../hooks/usePageContext';
import { routes, useRouter } from '../../hooks/router';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';

import { tr } from './PageHeader.i18n';
import s from './PageHeader.module.css';

export const PageHeader: FC<{ logo?: ComponentProps<typeof PageHeaderLogo>['logo'] }> = ({ logo }) => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();

    const links = [
        {
            href: routes.index(),
            title: tr('Dashboard'),
        },
        {
            href: routes.goals(),
            title: tr('Goals'),
            attr: headerMenuGoals.attr,
        },
        {
            href: routes.exploreTopProjects(),
            title: tr('Explore'),
            attr: headerMenuExplore.attr,
        },
    ];

    const onUserMenuClick = useCallback(() => (user ? userSettings() : signIn()), [user, userSettings, signIn]);

    return (
        <Header
            className={s.PageHeader}
            logo={
                <HeaderLogo>
                    <PageHeaderLogo logo={logo} />
                </HeaderLogo>
            }
            menu={
                <HeaderMenu>
                    <UserMenu onClick={onUserMenuClick} avatar={user?.image} email={user?.email} name={user?.name} />
                </HeaderMenu>
            }
            nav={
                <HeaderNav className={s.PageHeaderNav} {...headerMenu.attr}>
                    {links.map(({ href, title, attr }) => (
                        <NextLink href={href} passHref key={href} legacyBehavior>
                            <HeaderNavLink {...attr}>{title}</HeaderNavLink>
                        </NextLink>
                    ))}
                    <div className={s.PageHeaderSearch}>
                        <GlobalSearch />
                    </div>
                </HeaderNav>
            }
            {...header.attr}
        >
            <HeaderContent>
                <PageHeaderActionButton />
            </HeaderContent>
        </Header>
    );
};
