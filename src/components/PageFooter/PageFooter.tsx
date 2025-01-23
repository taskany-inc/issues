import { FC, useCallback } from 'react';
import { Footer, Link, FooterItem, FooterCopyright, FooterMenu, SheepLogo } from '@taskany/bricks/harmony';
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
        { title: tr('Contact us'), url: '/contactTaskany' },
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
            <FooterCopyright orgName={tr('Organization')} />
            <FooterMenu>
                <FooterItem onClick={dispatchModalEvent(ModalEvent.FeedbackCreateModal)} className={s.FooterItem}>
                    {tr('Feedback')}
                </FooterItem>

                {menuItems.map(({ title, url }) => (
                    <Link key={url} href={url} view="secondary">
                        <FooterItem>{title}</FooterItem>
                    </Link>
                ))}

                <FooterItem>
                    <Link onClick={onLocaleChange} view="secondary">
                        {tr('Locale change title')}{' '}
                    </Link>
                </FooterItem>
            </FooterMenu>
            <SheepLogo />
        </Footer>
    );
};
