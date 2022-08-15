import React, { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { Goal } from '../../graphql/@generated/genql';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';
import { nullable } from '../utils/nullable';

import { IssueParticipantsForm } from './IssueParticipantsForm';
import { IssueParticipantsList } from './IssueParticipantsList';

const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));

interface IssueParticipantsProps {
    issue: Goal;

    onChange?: React.ComponentProps<typeof IssueParticipantsForm>['onChange'];
}

export const IssueParticipants: React.FC<IssueParticipantsProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueParticipants');

    const onParticipantsEdit = useCallback(() => {
        if (onChange) {
            dispatchModalEvent(ModalEvent.IssueParticipantsModal)();
        }
    }, [onChange]);

    return (
        <>
            <IssueParticipantsList
                title={t('Participants')}
                participants={issue.participants}
                onEdit={onParticipantsEdit}
            />

            {nullable(onChange, () => (
                <ModalOnEvent event={ModalEvent.IssueParticipantsModal}>
                    <IssueParticipantsForm issue={issue} onChange={onChange} />
                </ModalOnEvent>
            ))}
        </>
    );
};
