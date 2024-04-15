import { FC, useCallback } from 'react';
import { Footer, Link, FooterItem } from '@taskany/bricks';
import { useRouter } from 'next/router';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { defaultLocale, languages } from '../../utils/getLang';
import { trpc } from '../../utils/trpcClient';
import { notifyPromise } from '../../utils/notifyPromise';

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

    const router = useRouter();
    const { locale } = router;

    const updateSettingsMutation = trpc.user.updateSettings.useMutation();
    const utils = trpc.useContext();
    const onLocaleChange = useCallback(async () => {
        const newLocale = locale === defaultLocale ? languages[1] : defaultLocale;

        const promise = updateSettingsMutation.mutateAsync(
            {
                locale: newLocale,
            },
            {
                onSuccess: () => {
                    utils.user.settings.invalidate();
                },
            },
        );

        await notifyPromise(promise, 'userSettingsUpdate');
    }, [updateSettingsMutation, utils.user.settings, locale]);

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
            <Link inline onClick={onLocaleChange}>
                <FooterItem>{tr('Locale change title')}</FooterItem>
            </Link>
        </Footer>
    );
};
