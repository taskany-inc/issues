import React from 'react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { routes } from '../hooks/router';

import { CommonHeader } from './CommonHeader';
import { TabsMenu, TabsMenuItem } from './TabsMenu';

interface ExplorePageLayoutProps {
    children: React.ReactNode;
}

export const ExplorePageLayout: React.FC<ExplorePageLayoutProps> = ({ children }) => {
    const t = useTranslations('explore');
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string]> = [
        [t('Teams'), routes.exploreTeams()],
        [t('Projects'), routes.exploreProjects()],
        // [t('Goals'), routes.exploreGoals()],
    ];

    return (
        <>
            <CommonHeader
                title={t('Explore')}
                description={t('see what the Taskany community is most excited about today')}
            >
                <div className="exploreActions"></div>

                <TabsMenu>
                    {tabsMenuOptions.map(([title, href]) => (
                        <NextLink key={href} href={href} passHref>
                            <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                        </NextLink>
                    ))}
                </TabsMenu>
            </CommonHeader>

            {children}
        </>
    );
};
