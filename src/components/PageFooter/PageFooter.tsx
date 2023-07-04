import { FC } from 'react';
import { Footer } from '@taskany/bricks';

import { tr } from './PageFooter.i18n';

export const PageFooter: FC = () => {
    const menuItems = [
        { title: tr('Terms'), url: '/terms' },
        { title: tr('Docs'), url: '/docs' },
        { title: tr('Contact Taskany'), url: '/contactTaskany' },
        { title: tr('API'), url: '/api' },
        { title: tr('About'), url: '/about' },
    ];
    return <Footer menuItems={menuItems} />;
};
