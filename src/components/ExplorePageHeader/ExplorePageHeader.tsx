import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Link, Switch, SwitchControl } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { CommonHeader } from '../CommonHeader';

import { tr } from './ExplorePageHeader.i18n';

export const ExplorePageHeader: React.FC = () => {
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string]> = [
        [tr('Top'), routes.exploreTopProjects()],
        [tr('Projects'), routes.exploreProjects()],
    ];

    return (
        <CommonHeader title={tr('Explore')}>
            <Switch value={router.asPath}>
                {tabsMenuOptions.map(([title, href]) => (
                    <NextLink key={href} href={href} passHref legacyBehavior>
                        <Link>
                            <SwitchControl value={href} text={title} />
                        </Link>
                    </NextLink>
                ))}
            </Switch>
        </CommonHeader>
    );
};
