import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { Goal, UserAnyKind } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';
import { gapL, gapM, gapS } from '../design/@generated/themes';

import { FormTitle } from './FormTitle';
import { UserPic } from './UserPic';
import { CleanButton } from './CleanButton';
import { Text } from './Text';
import { UserCompletionInput } from './UserCompletionInput';

interface IssueParticipantsFormProps {
    issue: Goal;
    onChange?: (activities: string[]) => void;
}

const StyledParticipants = styled.div`
    padding: ${gapM} 0 ${gapL};
`;

const StyledCleanButton = styled(CleanButton)``;

const StyledParticipant = styled.span`
    position: relative;
    display: inline-block;
    margin-right: ${gapS};

    &:hover {
        ${StyledCleanButton} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

export const IssueParticipantsForm: React.FC<IssueParticipantsFormProps> = ({ issue, onChange }) => {
    const t = useTranslations('IssueParticipantsForm');
    const activities = useMemo(() => new Set<string>(issue.participants?.map((p) => p!.id)), [issue]);

    const onParticipantDelete = useCallback(
        (id: string) => () => {
            activities.delete(id);
            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    const onParticipantAdd = useCallback(
        (u: UserAnyKind) => {
            if (u.activity) {
                activities.add(u.activity.id);
            }

            onChange && onChange(Array.from(activities));
        },
        [activities, onChange],
    );

    return (
        <>
            <FormTitle>{t('Edit participants')}</FormTitle>

            <Text weight="bold">{t('Already participating')}:</Text>
            <StyledParticipants>
                {issue.participants?.map((p) =>
                    nullable(p, (pa) => (
                        <StyledParticipant key={pa.id}>
                            <StyledCleanButton onClick={onParticipantDelete(pa.id)} />
                            <UserPic src={pa.user?.image} size={32} />
                        </StyledParticipant>
                    )),
                )}
            </StyledParticipants>

            <UserCompletionInput placeholder={t('Add participants')} onClick={onParticipantAdd} />
        </>
    );
};
