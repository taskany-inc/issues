import { useCallback, useMemo, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { gapL, gapM } from '@taskany/colors';
import { ComboBox, FormInput, FormTitle, ModalContent, ModalHeader } from '@taskany/bricks';

import { Activity, Goal } from '../../../graphql/@generated/genql';
import { trpc } from '../../utils/trpcClient';
import { IssueParticipantsList } from '../IssueParticipantsList';
import { UserMenuItem } from '../UserMenuItem';

import { tr } from './IssueParticipantsForm.i18n';

interface IssueParticipantsFormProps {
    issue: Goal;

    onChange?: (activities: string[]) => void;
}

const StyledCompletion = styled.div`
    padding: ${gapL} 0 ${gapM};
`;

export const IssueParticipantsForm: React.FC<IssueParticipantsFormProps> = ({ issue, onChange }) => {
    const [query, setQuery] = useState('');
    const [completionVisible, setCompletionVisible] = useState(false);
    const activities = useMemo(() => new Set<string>(issue.participants?.map((p) => p!.id)), [issue]);

    const alreadyParticipants = issue.participants?.map((p) => p!.id);
    const suggestions = trpc.user.suggestions.useQuery({ query, filter: alreadyParticipants });

    const onParticipantDelete = useCallback(
        (id: string) => {
            activities.delete(id);

            onChange?.(Array.from(activities));
        },
        [activities, onChange],
    );

    const onParticipantAdd = useCallback(
        (activity: Activity) => {
            activities.add(activity.id);

            setQuery('');

            onChange?.(Array.from(activities));
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
                    participants={issue.participants}
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
