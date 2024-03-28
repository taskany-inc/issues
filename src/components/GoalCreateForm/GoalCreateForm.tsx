import { MutableRefObject, useCallback, useMemo, useState } from 'react';
import { gray9 } from '@taskany/colors';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';
import { Button, Text } from '@taskany/bricks/harmony';
import { KeyCode, useKeyboard } from '@taskany/bricks';

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
import { FormActions } from '../FormActions/FormActions';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

import { tr } from './GoalCreateForm.i18n';
import s from './GoalCreateForm.module.css';

interface GoalCreateFormProps {
    title?: string;
    onGoalCreate?: (val: GoalCreateReturnType) => void;
    personal?: boolean;
}

const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ title, onGoalCreate, personal }) => {
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
    const [isOpen, setIsOpen] = useState(false);

    const createOptions = [
        {
            id: '1',
            title: tr('Create & Go'),
            clue: tr('Create and go to the goal page'),
            value: 1,
            attr: goalActionCreateAndGo.attr,
        },
        {
            id: '2',
            title: tr('Create one more'),
            clue: tr('Create and open new form for the next goal'),
            value: 2,
            attr: goalActionCreateOneMore.attr,
        },
        {
            id: '3',
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
            newRecentProjectsCache[form.parent.id] = {
                rate: Date.now(),
                cache: form.parent,
            };

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

    const onCloseActions = useCallback(() => {
        setIsOpen(false);
    }, []);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        onCloseActions();
    });

    return (
        <GoalForm
            busy={busy}
            validitySchema={goalCommonSchema}
            owner={{ id: user?.activityId, user } as ActivityByIdReturnType}
            parent={currentProjectCache || lastProjectCache || undefined}
            personal={personal}
            priority={defaultPriority ?? undefined}
            onSubmit={createGoal}
            title={title}
            actionButton={
                <FormActions>
                    <Button
                        text={tr('Cancel')}
                        size="m"
                        onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                        {...goalCancelButton.attr}
                    />
                    <div className={s.FormControl} {...combobox.attr}>
                        <Button
                            view="primary"
                            disabled={busy}
                            type="submit"
                            brick="right"
                            size="m"
                            text={createOptions[createGoalType - 1].title}
                            {...createOptions[createGoalType - 1].attr}
                        />
                        <Dropdown isOpen={isOpen} onClose={onCloseActions}>
                            <DropdownTrigger
                                renderTrigger={(props) => (
                                    <Button
                                        view="primary"
                                        brick="left"
                                        size="m"
                                        ref={props.ref as MutableRefObject<HTMLButtonElement>}
                                        onClick={() => {
                                            setIsOpen(true);
                                            props.onClick();
                                        }}
                                        iconRight={
                                            props.isOpen ? (
                                                <IconUpSmallSolid size="s" />
                                            ) : (
                                                <IconDownSmallSolid size="s" />
                                            )
                                        }
                                        {...(isOpen ? onESC : {})}
                                        {...createActionToggle.attr}
                                    />
                                )}
                            />
                            <DropdownPanel
                                placement="top-end"
                                items={createOptions}
                                mode="single"
                                onChange={onCreateTypeChange}
                                renderItem={(props) => (
                                    <div onClick={() => onCreateTypeChange(props.item)} className={s.MenuItem}>
                                        <Text size="m">{props.item.title}</Text>
                                        {props.item.clue && (
                                            <Text size="s" color={gray9}>
                                                {props.item.clue}
                                            </Text>
                                        )}
                                    </div>
                                )}
                            />
                        </Dropdown>
                    </div>
                </FormActions>
            }
            {...goalForm.attr}
        />
    );
};

export default GoalCreateForm;
