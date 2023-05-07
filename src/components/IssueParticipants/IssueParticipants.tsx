import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { nullable } from '@taskany/bricks';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { IssueParticipantsForm } from '../IssueParticipantsForm/IssueParticipantsForm';
import { IssueParticipantsList } from '../IssueParticipantsList';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './IssueParticipants.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

interface IssueParticipantsProps {
    participants: ActivityByIdReturnType[];

    onChange?: React.ComponentProps<typeof IssueParticipantsForm>['onChange'];
}

const IssueParticipants: React.FC<IssueParticipantsProps> = ({ participants, onChange }) => {
    const onParticipantsEdit = useCallback(() => {
        if (onChange) {
            dispatchModalEvent(ModalEvent.IssueParticipantsModal)();
        }
    }, [onChange]);

    return (
        <>
            <IssueParticipantsList
                title={tr('Participants')}
                participants={participants}
                onEdit={onChange ? onParticipantsEdit : undefined}
            />

            {nullable(onChange, () => (
                <ModalOnEvent event={ModalEvent.IssueParticipantsModal}>
                    <IssueParticipantsForm participants={participants} onChange={onChange} />
                </ModalOnEvent>
            ))}
        </>
    );
};

export default IssueParticipants;
