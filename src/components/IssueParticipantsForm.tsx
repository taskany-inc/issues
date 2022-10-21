import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { gapL, gapM } from '../design/@generated/themes';
import { Activity, Goal } from '../../graphql/@generated/genql';

import { FormTitle } from './FormTitle';
import { UserCompletionInput } from './UserCompletionInput';
import { IssueParticipantsList } from './IssueParticipantsList';

interface IssueParticipantsFormProps {
    issue: Goal;

    onChange?: (activities: string[]) => void;
}

const StyledCompletion = styled.div`
    padding: ${gapL} 0 ${gapM};
`;

export const IssueParticipantsForm: React.FC<IssueParticipantsFormProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueParticipants');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const activities = useMemo(() => new Set<string>(issue.participants?.map((p) => p!.id)), [issue]);

    const onParticipantDelete = useCallback(
        (id: string) => {
            activities.delete(id);
            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    const onParticipantAdd = useCallback(
        (activity: Activity) => {
            if (activity) {
                activities.add(activity.id);
            }

            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    return (
        <>
            <FormTitle>{t('Edit participants')}</FormTitle>

            <IssueParticipantsList
                title={t('Participants')}
                participants={issue.participants}
                onDelete={onParticipantDelete}
            />

            <StyledCompletion>
                <UserCompletionInput placeholder={t('Add participants')} onClick={onParticipantAdd} />
            </StyledCompletion>
        </>
    );
};
