import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { TabsMenu, TabsMenuItem } from '@taskany/bricks';

import { routes } from '../../hooks/router';
import { CommonHeader } from '../CommonHeader';

import { tr } from './ExplorePageLayout.i18n';

interface ExplorePageLayoutProps {
    children: React.ReactNode;
}

export const ExplorePageLayout: React.FC<ExplorePageLayoutProps> = ({ children }) => {
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string]> = [
        [tr('Top'), routes.exploreTopProjects()],
        [tr('Projects'), routes.exploreProjects()],
        // [tr('Goals'), routes.exploreGoals()],
    ];

    return (
        <>
            <CommonHeader
                title={tr('Explore')}
                description={tr('See what the Taskany community is most excited about today')}
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
