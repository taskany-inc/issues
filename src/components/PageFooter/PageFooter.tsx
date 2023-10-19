import { FC } from 'react';
import { Footer, Link, FooterItem } from '@taskany/bricks';
import { textColor } from '@taskany/colors';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Light } from '../Light';

import { tr } from './PageFooter.i18n';

export const PageFooter: FC = () => {
    const menuItems = [
        { title: tr('Terms'), url: '/terms' },
        { title: tr('Docs'), url: '/docs' },
        { title: tr('Contact Taskany'), url: '/contactTaskany' },
        { title: tr('API'), url: '/api' },
        { title: tr('About'), url: '/about' },
    ];
    return (
        <Footer>
            <Light color={textColor}>
                <FooterItem onClick={dispatchModalEvent(ModalEvent.FeedbackCreateModal)}>{tr('Feedback')}</FooterItem>
            </Light>

            {menuItems.map(({ title, url }) => (
                <Link key={url} href={url} inline>
                    <FooterItem>{title}</FooterItem>
                </Link>
            ))}
        </Footer>
    );
};
