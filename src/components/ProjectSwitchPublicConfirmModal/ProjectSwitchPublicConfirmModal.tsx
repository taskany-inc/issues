import { FC, useCallback } from 'react';
import { ModalContent, ModalHeader, Tip, Button, Text } from '@taskany/bricks/harmony';
import { IconExclamationCircleSolid } from '@taskany/icons';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import ModalOnEvent, { ModalContext } from '../ModalOnEvent';

import { tr } from './ProjectSwitchPublicConfirmModal.i18n';
import s from './ProjectSwitchPublicConfirmModal.module.css';

const closeModal = () => dispatchModalEvent(ModalEvent.ProjectSwitchPublicConfirmModal, {})();

const ProjectSwitchPublicConfirm: FC<{
    onConfirm?: () => void;
}> = ({ onConfirm }) => {
    const onCancelCallback = useCallback(() => {
        closeModal();
    }, []);

    const onConfirmCallback = useCallback(() => {
        closeModal();
        onConfirm?.();
    }, [onConfirm]);

    return (
        <>
            <ModalHeader>
                <Text size="xl" weight="bolder">
                    {tr('You are going to make project public')}
                </Text>
            </ModalHeader>
            <ModalContent className={s.ProjectSwitchPublicConfirmContent}>
                <div className={s.ProjectSwitchPublicConfirmModalNote}>
                    <Tip view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                        {tr('Project goals will be available to all users')}
                    </Tip>
                </div>

                <div className={s.ProjectSwitchPublicConfirmModalActions}>
                    <Button text={tr('Cancel')} onClick={onCancelCallback} />
                    <Button view="warning" text={tr('Ok, got it')} onClick={onConfirmCallback} />
                </div>
            </ModalContent>
        </>
    );
};

export const ProjectSwitchPublicConfirmModal: FC = () => (
    <ModalOnEvent view="warn" event={ModalEvent.ProjectSwitchPublicConfirmModal}>
        <ModalContext.Consumer>
            {(ctx) => <ProjectSwitchPublicConfirm {...ctx[ModalEvent.ProjectSwitchPublicConfirmModal]} />}
        </ModalContext.Consumer>
    </ModalOnEvent>
);
