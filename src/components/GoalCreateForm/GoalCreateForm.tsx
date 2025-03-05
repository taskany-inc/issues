import { useCallback, useContext, useMemo, useState } from 'react';
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
import { ActivityByIdReturnType, GoalByIdReturnType, GoalCreateReturnType } from '../../../trpc/inferredTypes';
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
import { FormAction } from '../FormActions/FormActions';
import { ProjectContext } from '../ProjectContext/ProjectContext';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

import { tr } from './GoalCreateForm.i18n';
import s from './GoalCreateForm.module.css';

interface GoalCreateFormProps
    extends Partial<Pick<NonNullable<GoalByIdReturnType>, 'priority' | 'description' | 'title' | 'personal' | 'tags'>> {
    onGoalCreate?: (val: GoalCreateReturnType) => void;
    project?: {
        id: string;
        title: string;
        flowId: string;
    } | null;
}

const GoalCreateForm: React.FC<GoalCreateFormProps> = ({
    title,
    onGoalCreate,
    personal,
    project,
    description,
    priority,
    tags,
}) => {
    const router = useRouter();
    const { user } = usePageContext();
    const [goalCreateFormActionCache, setGoalCreateFormActionCache] = useLocalStorage('goalCreateFormAction');
    const [busy, setBusy] = useState(false);
    const [createGoalType, setСreateGoalType] = useState<number>(goalCreateFormActionCache || 3);
    const utils = trpc.useContext();
    const { goalCreate } = useGoalResource({});
    const { data: priorities } = trpc.priority.getAll.useQuery();
    const defaultPriority = useMemo(() => priorities?.filter((priority) => priority.default)[0], [priorities]);
    const [isOpen, setIsOpen] = useState(false);

    const { project: parent } = useContext(ProjectContext);

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
        const res = await goalCreate(
            form,
            form.parent != null && form.mode === 'default'
                ? {
                      PROJECT_IS_ARCHIVED: tr
                          .raw('Cannot create goal in archived project', {
                              project: form.parent.title,
                              key: form.parent.id,
                          })
                          .join(''),
                  }
                : undefined,
        );

        setBusy(false);

        if (!res || !res._shortId) {
            return;
        }

        utils.v2.project.getAll.invalidate();
        utils.v2.goal.getAllGoals.invalidate();
        utils.v2.project.userProjects.invalidate();
        utils.v2.project.getProjectChildrenTree.invalidate();
        utils.v2.project.getProjectGoalsById.invalidate();
        utils.v2.project.getUserDashboardProjects.invalidate();

        if (form.parent && form.mode === 'default') {
            utils.v2.project.getProjectGoalsById.invalidate({ id: form.parent.id });
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
            personal={!!personal}
            onSubmit={createGoal}
            title={title}
            description={description}
            owner={{ id: user?.activityId, user } as ActivityByIdReturnType}
            parent={project ?? parent ?? undefined}
            priority={priority ?? defaultPriority ?? undefined}
            tags={tags}
            actionButton={
                <FormAction className={s.FormActions}>
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
                                        ref={props.ref}
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
                                    <div
                                        onClick={() => onCreateTypeChange(props.item)}
                                        className={s.FormCreateOptionItem}
                                    >
                                        <Text size="m">{props.item.title}</Text>
                                        {props.item.clue && (
                                            <Text size="s" className={s.FormCreateOptionClue}>
                                                {props.item.clue}
                                            </Text>
                                        )}
                                    </div>
                                )}
                            />
                        </Dropdown>
                    </div>
                </FormAction>
            }
            {...goalForm.attr}
        />
    );
};

export default GoalCreateForm;
