import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { gray9, gray10 } from '@taskany/colors';
import { BulbOnIcon, Button, Dropdown, ArrowUpSmallIcon, ArrowDownSmallIcon, MenuItem, Text } from '@taskany/bricks';

import { useRouter } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { Tip } from '../Tip';
import { Keyboard } from '../Keyboard';
import { GoalForm } from '../GoalForm/GoalForm';
import { trpc } from '../../utils/trpcClient';
import { GoalCommon, goalCommonSchema } from '../../schema/goal';
import { ActivityByIdReturnType, GoalCreateReturnType } from '../../../trpc/inferredTypes';
import { notifyPromise } from '../../utils/notifyPromise';

import { tr } from './GoalCreateForm.i18n';

const StyledMenuItem = styled(MenuItem)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    border: none;
    width: 140px;
    padding: 0;
`;

const StyledButtonWithDropdown = styled.div`
    display: flex;
    align-items: center;
`;

interface GoalCreateFormProps {
    title?: string;
    onGoalCreate?: (val: GoalCreateReturnType) => void;
}

const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ title, onGoalCreate }) => {
    const router = useRouter();
    const { user } = usePageContext();
    const [lastProjectCache, setLastProjectCache] = useLocalStorage('lastProjectCache');
    const [currentProjectCache] = useLocalStorage('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage('recentProjectsCache', {});
    const [goalCreateFormActionCache, setGoalCreateFormActionCache] = useLocalStorage('goalCreateFormAction');
    const [busy, setBusy] = useState(false);
    const [createGoalType, setСreateGoalType] = useState<number>(goalCreateFormActionCache || 3);

    const createOptions = [
        {
            title: tr('Create & Go'),
            clue: tr('Create and go to the goal page'),
            value: 1,
        },
        {
            title: tr('Create one more'),
            clue: tr('Create and open new form for the next goal'),
            value: 2,
        },
        {
            title: tr('Create only'),
            clue: tr('Create goal and close form'),
            value: 3,
        },
    ];

    type CreateOptions = typeof createOptions;
    const onCreateTypeChange = useCallback((item: CreateOptions[number]) => {
        setСreateGoalType(item.value);
    }, []);
    const createMutation = trpc.goal.create.useMutation();
    const createGoal = async (form: GoalCommon) => {
        setBusy(true);

        const [res] = await notifyPromise(createMutation.mutateAsync(form), 'goalsCreate');

        if (res && res._shortId) {
            const newRecentProjectsCache = { ...recentProjectsCache };
            if (newRecentProjectsCache[form.parent.id]) {
                newRecentProjectsCache[form.parent.id].rate += 1;
            } else {
                newRecentProjectsCache[form.parent.id] = {
                    rate: 1,
                    cache: form.parent,
                };
            }
            setRecentProjectsCache(newRecentProjectsCache);
            setLastProjectCache(form.parent);
            setGoalCreateFormActionCache(createGoalType);

            if (createGoalType === 1) {
                router.goal(res._shortId);
                dispatchModalEvent(ModalEvent.GoalCreateModal)();
            }

            if (createGoalType === 2) {
                dispatchModalEvent(ModalEvent.GoalCreateModal)();
                setTimeout(() => {
                    dispatchModalEvent(ModalEvent.GoalCreateModal)();
                }, 0);
            }

            if (createGoalType === 3) {
                dispatchModalEvent(ModalEvent.GoalCreateModal)();
            }

            onGoalCreate?.(res);
        }

        setBusy(false);
    };

    return (
        <GoalForm
            busy={busy}
            validityScheme={goalCommonSchema}
            owner={{ id: user?.activityId, user } as ActivityByIdReturnType}
            parent={currentProjectCache || lastProjectCache || undefined}
            priority="Medium"
            onSumbit={createGoal}
            title={title}
            actionButton={
                <>
                    <Button outline text={tr('Cancel')} onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)} />
                    <StyledButtonWithDropdown>
                        <Button
                            view="primary"
                            disabled={busy}
                            outline
                            type="submit"
                            brick="right"
                            text={createOptions[createGoalType - 1].title}
                        />
                        <Dropdown
                            placement="top-end"
                            arrow
                            items={createOptions}
                            offset={[-5, 20]}
                            onChange={onCreateTypeChange}
                            renderTrigger={(props) => (
                                <Button
                                    disabled={busy}
                                    view="primary"
                                    outline
                                    brick="left"
                                    iconRight={
                                        props.visible ? (
                                            <ArrowUpSmallIcon size="s" noWrap />
                                        ) : (
                                            <ArrowDownSmallIcon size="s" noWrap />
                                        )
                                    }
                                    ref={props.ref}
                                    onClick={props.onClick}
                                />
                            )}
                            renderItem={(props) => (
                                <StyledMenuItem view="primary" key={props.item.id} ghost onClick={props.onClick}>
                                    <Text>{props.item.title}</Text>
                                    {props.item.clue && (
                                        <Text size="xs" color={gray9}>
                                            {props.item.clue}
                                        </Text>
                                    )}
                                </StyledMenuItem>
                            )}
                        />
                    </StyledButtonWithDropdown>
                </>
            }
            tip={
                <Tip title={tr('Pro tip!')} icon={<BulbOnIcon size="s" color={gray10} />}>
                    {tr.raw('Press key to create the goal', {
                        key: <Keyboard key={'cmd/enter'} command enter />,
                    })}
                </Tip>
            }
        />
    );
};

export default GoalCreateForm;
