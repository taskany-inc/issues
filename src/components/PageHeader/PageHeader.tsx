import { FC, useCallback } from 'react';
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

import { header, headerMenu, headerMenuExplore, headerMenuGoals } from '../../utils/domObjects';
import { usePageContext } from '../../hooks/usePageContext';
import { routes, useRouter } from '../../hooks/router';
import { PageHeaderActionButton } from '../PageHeaderActionButton/PageHeaderActionButton';
import { PageHeaderLogo } from '../PageHeaderLogo';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import { BetaBadge } from '../BetaBadge';

import { tr } from './PageHeader.i18n';
import s from './PageHeader.module.css';

export const PageHeader: FC = () => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();

    const links = [
        {
            href: routes.goals(),
            title: tr('Goals'),
            attr: headerMenuGoals.attr,
            beta: false,
        },
        {
            href: routes.exploreTopProjects(),
            title: tr('Explore'),
            attr: headerMenuExplore.attr,
            beta: false,
        },
    ];

    const onUserMenuClick = useCallback(() => (user ? userSettings() : signIn()), [user, userSettings, signIn]);

    return (
        <Header
            className={s.PageHeader}
            logo={
                <HeaderLogo>
                    <PageHeaderLogo />
                </HeaderLogo>
            }
            menu={
                <HeaderMenu>
                    <UserMenu onClick={onUserMenuClick} avatar={user?.image} email={user?.email} name={user?.name} />
                </HeaderMenu>
            }
            nav={
                <HeaderNav className={s.PageHeaderNav} {...headerMenu.attr}>
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
