import { FC, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { TabsMenu, TabsMenuItem, nullable } from '@taskany/bricks';

import { routes } from '../../hooks/router';
import { pageTabs, pageActiveTabItem } from '../../utils/domObjects';

import { tr } from './ProjectPageTabs.i18n';

export const ProjectPageTabs: FC<{ id: string; editable?: boolean }> = ({ id, editable = false }) => {
    const tabsMenuOptions: Array<[title: string, href: string, ownerOnly: boolean]> = useMemo(
        () =>
            [
                [tr('Goals'), routes.project(id), false],
                process.env.NEXT_PUBLIC_CREW_URL ? [tr('Resources'), routes.projectTeam(id), false] : null,
                [tr('Settings'), routes.projectSettings(id), true],
            ].filter(Boolean),
        [id],
    );

    const nextRouter = useRouter();

    return (
        <TabsMenu {...pageTabs.attr}>
            {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                nullable(ownerOnly ? editable : true, () => {
                    const isActive = nextRouter.asPath.split('?')[0] === href;
                    const activeAttrs = isActive ? pageActiveTabItem.attr : null;

                    return (
                        <NextLink key={title} href={href} passHref legacyBehavior>
                            <TabsMenuItem active={isActive} {...activeAttrs}>
                                {title}
                            </TabsMenuItem>
                        </NextLink>
                    );
                }),
            )}
        </TabsMenu>
    );
};
