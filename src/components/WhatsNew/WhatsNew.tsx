import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormTitle, ModalContent, ModalHeader, nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { Button } from '@taskany/bricks/harmony';

import { routes } from '../../hooks/router';
import { useLocale } from '../../hooks/useLocale';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { trpc } from '../../utils/trpcClient';

import { tr } from './WhatsNew.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

const StyledIframe = styled.iframe<{ visible?: boolean }>`
    width: 100%;
    height: 400px;
    border: 0;

    visibility: hidden;

    ${({ visible }) =>
        visible &&
        `
        visibility: visible;
    `}
`;

const StyledFooter = styled.div`
    padding-top: var(--gap-m);
    display: flex;
    justify-content: end;
    gap: var(--gap-s);
`;

const WhatsNew = () => {
    const locale = useLocale();
    const [iframeReady, setIframeReady] = useState(false);

    const { data } = trpc.whatsnew.check.useQuery({
        locale,
    });

    useEffect(() => {
        if (data?.releaseNotesExists && data?.version && !data?.read && !data?.delayed) {
            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [data]);

    const onIframeLoad = useCallback(() => {
        // TODO: show sausages
        setIframeReady(true);
    }, []);

    const markAsReadMutation = trpc.whatsnew.markAsRead.useMutation();
    const onReadClick = useCallback(async () => {
        if (data?.version) {
            await markAsReadMutation.mutateAsync({
                version: data.version,
            });

            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [markAsReadMutation, data]);

    const markAsDelayedMutation = trpc.whatsnew.markAsDelayed.useMutation();
    const onDelayClick = useCallback(async () => {
        if (data?.version) {
            await markAsDelayedMutation.mutateAsync({
                version: data.version,
            });

            dispatchModalEvent(ModalEvent.WhatsNewModal)();
        }
    }, [markAsDelayedMutation, data]);

    return (
        <ModalOnEvent event={ModalEvent.WhatsNewModal}>
            <ModalHeader>
                <FormTitle>{tr("What's New!")}</FormTitle>
            </ModalHeader>
            <ModalContent>
                {nullable(data?.version, (v) => (
                    <StyledIframe src={routes.whatsnew(v, locale)} onLoad={onIframeLoad} visible={iframeReady} />
                ))}

                <StyledFooter>
                    <Button text={tr('Dismiss')} onClick={onDelayClick} />
                    <Button view="primary" text={tr('Awesome! Thank you!')} onClick={onReadClick} />
                </StyledFooter>
            </ModalContent>
        </ModalOnEvent>
    );
};

export default WhatsNew;
