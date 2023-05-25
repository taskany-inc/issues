import { useCallback, useMemo, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { gapL, gapM } from '@taskany/colors';
import { ComboBox, FormInput, FormTitle, ModalContent, ModalHeader, UserMenuItem } from '@taskany/bricks';

import { GoalParticipantsSchema } from '../../schema/goal';
import { trpc } from '../../utils/trpcClient';
import { IssueParticipantsList } from '../IssueParticipantsList';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';

import { tr } from './IssueParticipantsForm.i18n';

interface IssueParticipantsFormProps {
    participants: ActivityByIdReturnType[];

    onChange?: (participants: GoalParticipantsSchema['participants']) => void;
}

const StyledCompletion = styled.div`
    padding: ${gapL} 0 ${gapM};
`;

export const IssueParticipantsForm: React.FC<IssueParticipantsFormProps> = ({ participants, onChange }) => {
    const [query, setQuery] = useState('');
    const [completionVisible, setCompletionVisible] = useState(false);
    const activities = useMemo(
        () =>
            new Map<string, GoalParticipantsSchema['participants'][number]>(
                participants.map((p) => [
                    p.id,
                    {
                        id: p.id,
                        name: p.user?.nickname ?? p.user?.name ?? p.user?.email ?? '',
                    },
                ]),
            ),
        [participants],
    );

    const alreadyParticipants = participants.map((p) => p.id);
    const suggestions = trpc.user.suggestions.useQuery({ query, filter: alreadyParticipants });

    const onParticipantDelete = useCallback(
        (id: string) => {
            activities.delete(id);

            onChange?.(Array.from(activities.values()));
        },
        [activities, onChange],
    );

    const onParticipantAdd = useCallback(
        (activity: ActivityByIdReturnType) => {
            activities.set(activity.id, {
                id: activity.id,
                name: activity.user?.nickname ?? activity.user?.name ?? activity.user?.email ?? '',
            });

            setQuery('');

            onChange?.(Array.from(activities.values()));
        },
        [activities, onChange],
    );

    return (
        <>
            <ModalHeader>
                <FormTitle>{tr('Edit participants')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <IssueParticipantsList
                    title={tr('Participants')}
                    participants={participants}
                    onDelete={onParticipantDelete}
                />

                <StyledCompletion>
                    <ComboBox
                        text={query}
                        value={query}
                        visible={completionVisible}
                        items={suggestions?.data}
                        onChange={onParticipantAdd}
                        renderInput={(props) => (
                            <FormInput
                                autoFocus
                                placeholder={tr('Add participants')}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setQuery(e.currentTarget.value);
                                    setCompletionVisible(true);
                                }}
                                {...props}
                            />
                        )}
                        renderItem={(props) => (
                            <UserMenuItem
                                key={props.item.id}
                                name={props.item.user?.name}
                                email={props.item.user?.email || props.item.ghost?.email}
                                image={props.item.user?.image}
                                focused={props.cursor === props.index}
                                onClick={props.onClick}
                            />
                        )}
                    />
                </StyledCompletion>
            </ModalContent>
        </>
    );
};
