import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { gray9 } from '@taskany/colors';
import { MenuItem, Text } from '@taskany/bricks';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';
import { Button, Dropdown, DropdownPanel, DropdownTrigger } from '@taskany/bricks/harmony';

import { useRouter } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalForm } from '../GoalForm/GoalForm';
import { trpc } from '../../utils/trpcClient';
import { GoalCommon, goalCommonSchema } from '../../schema/goal';
import { ActivityByIdReturnType, GoalCreateReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import {
    combobox,
    createActionToggle,
    goalActionCreateAndGo,
    goalActionCreateOneMore,
    goalActionCreateOnly,
    goalCancelButton,
    goalForm,
} from '../../utils/domObjects';
import RotatableTip from '../RotatableTip/RotatableTip';

import { tr } from './GoalCreateForm.i18n';

const StyledMenuItem = styled(MenuItem)`
    text-align: left;
    max-width: 240px;
`;

interface GoalCreateFormProps {
    project?: {
        id: string;
        title: string;
        flowId: string;
    };
    title?: string;
    onGoalCreate?: (val: GoalCreateReturnType) => void;
    personal?: boolean;
}

const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ title, onGoalCreate, project, personal }) => {
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
    const { data: priorities } = trpc.priority.getAll.useQuery();
    const defaultPriority = useMemo(() => priorities?.filter((priority) => priority.default)[0], [priorities]);

    const createOptions = [
        {
            title: tr('Create & Go'),
            clue: tr('Create and go to the goal page'),
            value: 1,
            attr: goalActionCreateAndGo.attr,
        },
        {
            title: tr('Create one more'),
            clue: tr('Create and open new form for the next goal'),
            value: 2,
            attr: goalActionCreateOneMore.attr,
        },
        {
            title: tr('Create only'),
            clue: tr('Create goal and close form'),
            value: 3,
            attr: goalActionCreateOnly.attr,
        },
    ];

    type CreateOptions = typeof createOptions;
    const onCreateTypeChange = useCallback((item: CreateOptions[number]) => {
        setСreateGoalType(item.value);
    }, []);

    const createGoal = async (form: GoalCommon) => {
        setBusy(true);

        const res = await goalCreate(form);

        setBusy(false);

        if (!res || !res._shortId) {
            return;
        }

        utils.project.getAll.invalidate();
        utils.goal.getBatch.invalidate();
        utils.project.getUserProjectsWithGoals.invalidate();

        if (form.parent) {
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

            utils.project.getDeepInfo.invalidate({ id: form.parent.id });
        }

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
        setGoalCreateFormActionCache(createGoalType);
        onGoalCreate?.(res);
    };

    return (
        <GoalForm
            busy={busy}
            validitySchema={goalCommonSchema}
            owner={{ id: user?.activityId, user } as ActivityByIdReturnType}
            parent={project || currentProjectCache || lastProjectCache || undefined}
            personal={personal}
            priority={defaultPriority ?? undefined}
            onSubmit={createGoal}
            title={title}
            actionButton={
                <>
                    <Button
                        text={tr('Cancel')}
                        onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                        {...goalCancelButton.attr}
                    />
                    <>
                        <Button
                            view="primary"
                            disabled={busy}
                            type="submit"
                            brick="right"
                            text={createOptions[createGoalType - 1].title}
                            {...createOptions[createGoalType - 1].attr}
                        />
                        <Dropdown {...combobox.attr} hideOnClick>
                            <DropdownTrigger
                                arrow={false}
                                renderTrigger={(props) => (
                                    <Button
                                        view="primary"
                                        brick="left"
                                        ref={props.ref}
                                        onClick={props.onClick}
                                        iconRight={
                                            props.isOpen ? (
                                                <IconUpSmallSolid size="s" />
                                            ) : (
                                                <IconDownSmallSolid size="s" />
                                            )
                                        }
                                        {...createActionToggle.attr}
                                    />
                                )}
                            />
                            <DropdownPanel placement="top-end" arrow>
                                {createOptions.map((option) => (
                                    <StyledMenuItem
                                        view="primary"
                                        key={option.title}
                                        ghost
                                        {...option.attr}
                                        onClick={() => onCreateTypeChange(option)}
                                    >
                                        <Text>{option.title}</Text>
                                        {option.clue && (
                                            <Text size="xs" color={gray9}>
                                                {option.clue}
                                            </Text>
                                        )}
                                    </StyledMenuItem>
                                ))}
                            </DropdownPanel>
                        </Dropdown>
                    </>
                </>
            }
            tip={<RotatableTip context="goal" />}
            {...goalForm.attr}
        />
    );
};

export default GoalCreateForm;
