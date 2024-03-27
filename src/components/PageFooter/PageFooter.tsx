import { FC } from 'react';
import { Footer, Link, FooterItem } from '@taskany/bricks';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import s from './PageFooter.module.css';
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
            <FooterItem onClick={dispatchModalEvent(ModalEvent.FeedbackCreateModal)} className={s.FooterItem}>
                {tr('Feedback')}
            </FooterItem>

            {menuItems.map(({ title, url }) => (
                <Link key={url} href={url} inline>
                    <FooterItem>{title}</FooterItem>
                </Link>
            ))}
        </Footer>
    );
};
