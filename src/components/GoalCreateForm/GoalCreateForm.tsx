import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { gray9, gray10 } from '@taskany/colors';
import { Button, Dropdown, MenuItem, Text, Keyboard, Tip } from '@taskany/bricks';
import { IconBulbOnOutline, IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';

import { useRouter } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalForm } from '../GoalForm/GoalForm';
import { trpc } from '../../utils/trpcClient';
import { GoalCommon, goalCommonSchema } from '../../schema/goal';
import { ActivityByIdReturnType, GoalCreateReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { goalCreateForm } from '../../utils/domObjects';

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
    const utils = trpc.useContext();
    const { goalCreate } = useGoalResource({});

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

    const createGoal = async (form: GoalCommon) => {
        setBusy(true);

        const res = await goalCreate(form);

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
        utils.project.getDeepInfo.invalidate({ id: form.parent.id });
        setBusy(false);
    };

    return (
        <GoalForm
            busy={busy}
            validitySchema={goalCommonSchema}
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
                                        props.visible ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />
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
                <Tip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" color={gray10} />}>
                    {tr.raw('Press key to create the goal', {
                        key: <Keyboard key={'cmd/enter'} command enter />,
                    })}
                </Tip>
            }
            {...goalCreateForm.attr}
        />
    );
};

export default GoalCreateForm;
