import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys, inviteUserKeys } from '../utils/hotkeys';
import { Goal } from '../../graphql/@generated/genql';

import { Modal } from './Modal';
import { IssueParticipantsForm } from './IssueParticipantsForm';

interface IssueParticipantsModalProps {
    issue: Goal;

    onChange?: React.ComponentProps<typeof IssueParticipantsForm>['onChange'];
}

const IssueParticipantsModal: React.FC<IssueParticipantsModalProps> = ({ issue, onChange }) => {
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([inviteUserKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener(ModalEvent.IssueParticipantsModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.IssueParticipantsModal, globalListener);
        };
    }, []);

    const onFormSubmit = useCallback(
        (activities: string[]) => {
            onChange && onChange(activities);
        },
        [onChange],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <IssueParticipantsForm issue={issue} onChange={onFormSubmit} />
        </Modal>
    );
};

export default IssueParticipantsModal;
