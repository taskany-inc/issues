import { TabsMenu, TabsMenuItem } from '@taskany/bricks';
import NextLink from 'next/link';
import { useRouter as useNextRouter } from 'next/router';
import { FC, useMemo } from 'react';

import { routes } from '../../hooks/router';

import { tr } from './ProjectTabsMenu.i18n';

export const ProjectTabsMenu: FC<{ id?: string }> = ({ id }) => {
    const nextRouter = useNextRouter();

    const tabsMenuOptions: Array<[string, string, boolean]> = useMemo(
        () =>
            id
                ? [
                      [tr('Goals'), routes.project(id), false],
                      [tr('Settings'), routes.projectSettings(id), true],
                  ]
                : [[tr('Goals'), routes.projects(), false]],
        [id],
    );

    return (
        <TabsMenu>
            {tabsMenuOptions.map(([title, href]) => (
                <NextLink key={title} href={href} passHref legacyBehavior>
                    <TabsMenuItem active={nextRouter.asPath.split('?')[0] === href}>{title}</TabsMenuItem>
                </NextLink>
            ))}
        </TabsMenu>
    );
};
