import { FC, useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

import { Header, HeaderNavLink, HeaderNavItem } from '@common/Header';
import { UserMenu } from '@common/UserMenu';
import { usePageContext } from 'src/hooks/usePageContext';

import { routes, useRouter } from '../hooks/router';

import { PageHeaderActionButton } from './PageHeaderActionButton';
import { PageHeaderLogo } from './PageHeaderLogo';

const emptyCallback = () => {};

const PageHeaderLink: FC<HeaderNavItem> = ({ title, href }) => (
    <NextLink href={href} passHref>
        <HeaderNavLink>{title}</HeaderNavLink>
    </NextLink>
);

export const PageHeader: FC = () => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();
    const t = useTranslations('Header');

    const links = useMemo(
        () => [
            {
                href: routes.goals(),
                title: t('Goals'),
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
                href: routes.exploreTeams(),
                title: t('Explore'),
            },
        ],
        [t],
    );

    const onUserMenuClick = useCallback(() => {
        if (user) {
            userSettings();
        } else {
            signIn();
        }
    }, [user, userSettings, user]);

    return (
        <Header
            logo={<PageHeaderLogo />}
            menu={
                <UserMenu
                    onClick={onUserMenuClick}
                    avatar={user?.image ?? undefined}
                    email={user?.email ?? undefined}
                />
            }
            actionButton={<PageHeaderActionButton />}
            links={links}
            linkComponent={PageHeaderLink}
            onSearch={emptyCallback}
        />
    );
};
