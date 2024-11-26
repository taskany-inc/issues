import React, { MouseEvent, useCallback, useMemo, useRef, useState } from 'react';
import {
    Checkbox,
    CircleProgressBar,
    Table,
    TableCell,
    TableRow,
    Text,
    Popup,
    Badge,
    Dropdown,
    DropdownTrigger,
    DropdownPanel,
    MenuItem,
    Spinner,
    FlatProgressBar,
} from '@taskany/bricks/harmony';
import { nullable, useClickOutside } from '@taskany/bricks';
import {
    IconBinOutline,
    IconEdit1Outline,
    IconMessageTickOutline,
    IconMoreVerticalOutline,
    IconRefreshOutline,
    IconTargetOutline,
} from '@taskany/icons';
import classNames from 'classnames';

import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { trpc } from '../../utils/trpcClient';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger/GoalFormPopupTrigger';
import { useGoalResource } from '../../hooks/useGoalResource';
import { ActivityFeedItem } from '../ActivityFeed/ActivityFeed';
import { IssueMeta } from '../IssueMeta/IssueMeta';
import { Circle } from '../Circle/Circle';
import { routes } from '../../hooks/router';
import { getStateProps, GoalBadge } from '../GoalBadge';
import { JiraTaskBadge } from '../JiraTaskBadge/JiraTaskBadge';
import { safeUserData } from '../../utils/getUserName';
import { UserBadge } from '../UserBadge/UserBadge';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { useCriteriaValidityData } from '../CriteriaForm/CriteriaForm';
import { InlineUserBadge } from '../InlineUserBadge/InlineUserBadge';

import classes from './GoalCriteria.module.css';
import { tr } from './GoalCriteria.i18n';

type GoalCriteriaSuggestProps = React.ComponentProps<typeof GoalCriteriaSuggest>;

type GoalStateProps = NonNullable<React.ComponentProps<typeof GoalBadge>['state']>;
type ExternalTaskTypeProps = NonNullable<React.ComponentProps<typeof JiraTaskBadge>['type']>;
type CriteriaUpdateDataMode = NonNullable<GoalCriteriaSuggestProps['defaultMode']>;
interface CriteriaProps {
    title: string;
    weight?: number;
    id: string;
    isDone: boolean;
}

interface GoalCriteriaProps extends CriteriaProps {
    goal: {
        goalId: string;
        shortId: string;
        state: GoalStateProps | null;
        project?: string;
        owner?: ActivityByIdReturnType;
        progress?: number | null;
    };
}

interface ExternalTaskCriteriaProps extends CriteriaProps {
    externalTask: {
        id: string;
        title: string;
        externalKey: string;
        taskKey: string;
        project: string;
        type: ExternalTaskTypeProps;
        state?: {
            color: string | null;
            title: string;
        };
        assigneeEmail: string | null;
        assigneeName: string | null;
    };
}

type UnionCriteria = CriteriaProps | GoalCriteriaProps | ExternalTaskCriteriaProps;

type CanBeNullableValue<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K] | null;
};

interface GoalCriteriaEditableApi<T extends UnionCriteria> {
    onCreate?: (val: T) => void;
    onUpdate?: (val: T & { mode: CriteriaUpdateDataMode }) => void;
    onConvert?: (val: T) => void;
    onRemove?: (val: T) => void;
    onCheck?: (val: T) => void;
    onCheckJiraTask?: (val: T) => void;
    goalId: string;
    validityData: React.ComponentProps<typeof GoalCriteriaSuggest>['validityData'];
}

const goalStateIsExists = (state?: CanBeNullableValue<GoalStateProps> | null): state is GoalStateProps => {
    return state != null && state.lightForeground != null && state.darkForeground != null;
};

export function mapCriteria<
    T extends CriteriaProps,
    G extends {
        id: string;
        _shortId: string;
        title: string;
        projectId: string | null;
        owner: ActivityByIdReturnType | null;
        state: CanBeNullableValue<GoalStateProps> | null;
        completedCriteriaWeight?: number | null;
    },
    Et extends {
        title: string;
        type: string;
        typeIconUrl: string;
        state: string;
        stateColor: string | null;
        id: string;
        project: string;
        projectId: string;
        externalKey: string;
        assigneeName: string | null;
        assigneeEmail: string | null;
    },
>(criteria: T, connectedGoal: G | null, task: Et | null): UnionCriteria {
    if (connectedGoal) {
        const { state } = connectedGoal;

        return {
            id: criteria.id,
            goal: {
                goalId: connectedGoal.id,
                state: goalStateIsExists(state) ? state : null,
                shortId: connectedGoal._shortId,
                project: connectedGoal.projectId ?? undefined,
                owner: connectedGoal.owner ?? undefined,
                progress: connectedGoal.completedCriteriaWeight ?? null,
            },
            title: connectedGoal.title,
            isDone: criteria.isDone,
            weight: criteria.weight,
        };
    }

    if (task) {
        return {
            id: criteria.id,
            externalTask: {
                ...task,
                taskKey: task.externalKey,
                project: task.projectId,
                type: {
                    src: task.typeIconUrl,
                    title: task.type,
                },
                state: {
                    title: task.state,
                    color: task.stateColor,
                },
            },
            title: task.title,
            isDone: criteria.isDone,
            weight: criteria.weight,
        };
    }

    return {
        title: criteria.title,
        id: criteria.id,
        isDone: criteria.isDone,
        weight: criteria.weight,
    };
}

interface OnCheckCriteriaCallback {
    onCheck?: () => void;
}

const SimpleCriteria: React.FC<Omit<CriteriaProps, 'id'> & OnCheckCriteriaCallback> = ({
    title,
    isDone,
    weight,
    onCheck,
}) => (
    <TableRow className={classes.GoalCriteriaTableRow}>
        <TableCell width={450}>
            <Checkbox
                className={classNames(classes.GoalCriteriaItemCheckbox, {
                    [classes.CriteriaIsDone]: isDone,
                })}
                defaultChecked={isDone}
                readOnly={!onCheck}
                onClick={onCheck}
                strike={isDone}
                lines={2}
                ellipsis
                view="rounded"
                label={title}
            />
        </TableCell>
        <TableCell width="3ch" className={classes.GoalCriteriaWeightColumn}>
            {nullable((weight ?? 0) > 0, () => (
                <Text as="span" size="s" weight="regular" className={classes.GoalCriteriaItemWeight}>
                    {weight}
                </Text>
            ))}
        </TableCell>
    </TableRow>
);

const ExternalTaskCriteria = ({ title, externalTask, weight, isDone }: Omit<ExternalTaskCriteriaProps, 'id'>) => {
    const { assigneeEmail, assigneeName } = externalTask;
    let ownerData: ReturnType<typeof safeUserData> | null = null;

    if (assigneeEmail && assigneeName) {
        ownerData = safeUserData({
            user: {
                email: assigneeEmail,
                name: assigneeName,
            },
            ghost: null,
        });
    }

    return (
        <>
            <TableCell className={classes.GoalCriteriaTitleCell} width={300}>
                <JiraTaskBadge
                    title={title}
                    taskKey={externalTask.externalKey}
                    state={
                        externalTask.state
                            ? {
                                  title: externalTask.state.title,
                                  color: externalTask.state.color,
                              }
                            : null
                    }
                    href={routes.jiraTask(externalTask.externalKey)}
                    strike={isDone}
                />
            </TableCell>
            <TableCell width="10ch">
                <Text className={classes.CriteriaGoalProject} size="s">
                    {externalTask.project}
                </Text>
            </TableCell>
            <TableCell width={16}>
                {nullable(ownerData, (owner) => (
                    <InlineUserBadge {...owner} size="xs" tooltip={owner.name} short />
                ))}
            </TableCell>
            <TableCell width="3ch" className={classes.GoalCriteriaWeightColumn}>
                {nullable((weight ?? 0) > 0, () => (
                    <Text as="span" size="s" weight="regular" className={classes.GoalCriteriaItemWeight}>
                        {weight}
                    </Text>
                ))}
            </TableCell>
        </>
    );
};

const GoalCriteria = ({ title, goal, weight, isDone }: Omit<GoalCriteriaProps, 'id'>) => {
    const { setPreview } = useGoalPreview();
    const ownerData = safeUserData(goal.owner);

    const handleGoalCriteriaClick = useCallback<React.MouseEventHandler<HTMLSpanElement>>(
        (event) => {
            if (event.metaKey || event.ctrlKey || !goal?.shortId) return;
            event.preventDefault();
            setPreview(goal.shortId, { title, id: goal.goalId });
        },
        [setPreview, title, goal],
    );

    return (
        <>
            <TableCell className={classes.GoalCriteriaTitleCell} width={300}>
                <GoalBadge
                    title={title}
                    state={getStateProps(goal.state)}
                    href={routes.goal(goal.shortId)}
                    onClick={handleGoalCriteriaClick}
                    progress={goal.progress}
                    strike={isDone}
                />
            </TableCell>
            <TableCell width="10ch">
                <Text className={classes.CriteriaGoalProject} size="s">
                    {goal.project}
                </Text>
            </TableCell>
            <TableCell width={16}>
                {nullable(ownerData, (owner) => (
                    <UserBadge
                        className={classes.CritriaGoalOwner}
                        short
                        name={owner.name}
                        email={owner.email}
                        image={owner.image}
                        size="xs"
                    />
                ))}
            </TableCell>
            <TableCell width="3ch" className={classes.GoalCriteriaWeightColumn}>
                {nullable((weight ?? 0) > 0, () => (
                    <Text as="span" size="s" weight="regular" className={classes.GoalCriteriaItemWeight}>
                        {weight}
                    </Text>
                ))}
            </TableCell>
        </>
    );
};

interface CriteriaActionItem {
    label: string;
    handler: () => void;
    className?: string;
    icon: React.ReactNode;
}

const CriteriaActions: React.FC<{ actions: CriteriaActionItem[] }> = ({ actions }) => {
    const [visible, setVisible] = useState(false);

    const handleActionClick = useCallback((handler: CriteriaActionItem['handler']) => {
        return () => {
            handler();
            setVisible(false);
        };
    }, []);

    return (
        <Dropdown isOpen={visible} onClose={() => setVisible(false)}>
            <DropdownTrigger
                renderTrigger={({ ref }) => (
                    <div ref={ref}>
                        <Badge text={<IconMoreVerticalOutline size="xs" />} onClick={() => setVisible(!visible)} />
                    </div>
                )}
            />
            <DropdownPanel placement="bottom-start">
                <div className={classes.GoalCriteriaActions}>
                    {actions.map(({ icon, label, handler, className }) => (
                        <MenuItem
                            key={label}
                            className={classNames(classes.GoalCriteriaActionsItem, className)}
                            onClick={handleActionClick(handler)}
                        >
                            <Badge iconLeft={icon} text={label} weight="regular" />
                        </MenuItem>
                    ))}
                </div>
            </DropdownPanel>
        </Dropdown>
    );
};

function criteriaAsGoal(props: UnionCriteria): props is GoalCriteriaProps {
    return 'goal' in props && props.goal != null;
}

function criteriaAsExternalTask(props: UnionCriteria): props is ExternalTaskCriteriaProps {
    return 'externalTask' in props && props.externalTask != null;
}

export const Criteria: React.FC<
    UnionCriteria & GoalCriteriaEditableApi<UnionCriteria & { mode: CriteriaUpdateDataMode }>
> = ({ onConvert, onRemove, onUpdate, onCheck, onCheckJiraTask, validityData, ...props }) => {
    const [mode, setMode] = useState<'read' | 'edit'>('read');
    const { validateGoalCriteriaBindings } = useGoalResource({});

    const availableActions = useMemo<CriteriaActionItem[] | undefined>(() => {
        const actions: CriteriaActionItem[] = [];

        if (onUpdate) {
            actions.push({
                label: tr('Edit'),
                icon: <IconEdit1Outline size="xs" />,
                handler: () => setMode('edit'),
            });
        }

        if (!(criteriaAsGoal(props) || criteriaAsExternalTask(props)) && onConvert) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xs" />,
                handler: () => onConvert({ ...props, mode: 'simple' }),
            });
        }

        if (!props.isDone && criteriaAsExternalTask(props) && onCheckJiraTask) {
            actions.push({
                label: tr('Check the task status'),
                icon: <IconRefreshOutline size="xs" />,
                handler: () => onCheckJiraTask({ ...props, mode: 'task' }),
            });
        }

        if (onRemove) {
            actions.push({
                label: tr('Delete'),
                icon: <IconBinOutline size="xs" />,
                className: classes.GoalCriteriaActionDelete,
                handler: () => onRemove({ ...props, mode: 'simple' }),
            });
        }

        return actions;
    }, [onConvert, onRemove, onUpdate, onCheckJiraTask, props]);

    const handleCriteriaCheck = useCallback(() => {
        if (onCheck) {
            return () => {
                onCheck({ ...props, isDone: !props.isDone, mode: 'simple' });
            };
        }

        return undefined;
    }, [props, onCheck]);

    const [defaultMode, values]: [
        'simple' | 'goal' | 'task',
        React.ComponentProps<typeof GoalCriteriaSuggest>['values'],
    ] = useMemo(() => {
        if (criteriaAsGoal(props)) {
            return [
                'goal',
                {
                    id: props.id,
                    mode: 'goal',
                    title: props.title,
                    weight: props.weight ? `${props.weight}` : '',
                    selected: {
                        id: props.goal.goalId,
                        title: props.title,
                        state: props.goal.state,
                        _shortId: props.goal.shortId,
                        itemType: 'goal',
                    },
                },
            ];
        }

        if (criteriaAsExternalTask(props)) {
            return [
                'task',
                {
                    id: props.id,
                    mode: 'task',
                    title: props.title,
                    weight: props.weight ? `${props.weight}` : '',
                    selected: {
                        id: props.externalTask.id,
                        title: props.externalTask.title,
                        type: props.externalTask.type,
                        taskKey: props.externalTask.externalKey,
                        itemType: 'task',
                    },
                },
            ];
        }

        return [
            'simple',
            {
                id: props.id,
                mode: 'simple',
                title: props.title,
                weight: props.weight ? `${props.weight}` : '',
            },
        ];
    }, [props]);

    const handleCriteriaUpdate = useCallback<GoalCriteriaSuggestProps['onSubmit']>(
        (values) => {
            const valuesToUpdate: CriteriaProps & {
                mode: CriteriaUpdateDataMode;
                selected: { id?: string; externalKey?: string };
            } = {
                id: props.id,
                title: values.title,
                weight: Number(values.weight),
                isDone: props.isDone,
                mode: values.mode,
                selected: {
                    id: undefined,
                    externalKey: undefined,
                },
            };

            switch (values.mode) {
                case 'goal':
                    valuesToUpdate.selected.id = values.selected.id;
                    break;
                case 'task':
                    valuesToUpdate.selected.externalKey = values.selected.taskKey;
                    break;
                default:
            }

            if (onUpdate) {
                onUpdate(valuesToUpdate);
            }
        },
        [onUpdate, props.id, props.isDone],
    );

    const currentValidityData = useMemo(() => {
        const { title, sumOfCriteria } = validityData;

        // need exclude current criterion from validity data
        return {
            sumOfCriteria: sumOfCriteria - (props.weight ?? 0),
            title: title.filter((t) => t !== props.title),
        };
    }, [validityData, props.title, props.weight]);

    const isSimpleCriteria = !criteriaAsExternalTask(props) && !criteriaAsGoal(props);

    return (
        <TableRow className={classes.GoalCriteriaTableRow}>
            {criteriaAsGoal(props) && (
                <GoalCriteria title={props.title} weight={props.weight} isDone={props.isDone} goal={props.goal} />
            )}
            {criteriaAsExternalTask(props) && (
                <ExternalTaskCriteria
                    title={props.title}
                    weight={props.weight}
                    isDone={props.isDone}
                    externalTask={props.externalTask}
                />
            )}
            {isSimpleCriteria && (
                <SimpleCriteria
                    title={props.title}
                    isDone={props.isDone}
                    weight={props.weight}
                    onCheck={onCheck ? handleCriteriaCheck() : undefined}
                />
            )}
            {nullable(availableActions, (actions) => (
                <TableCell width="3rem">
                    <CriteriaActions actions={actions} />
                </TableCell>
            ))}
            {nullable(mode === 'edit', () => (
                <GoalFormPopupTrigger
                    defaultVisible
                    renderTrigger={({ ref }) => <div ref={ref} className={classes.GoalFormPopupTrigger} />}
                    onCancel={() => setMode('read')}
                    placement="bottom-end"
                    offset={[-45, 0]}
                >
                    <GoalCriteriaSuggest
                        id={props.goalId}
                        defaultMode={defaultMode}
                        values={values}
                        onSubmit={handleCriteriaUpdate}
                        validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                        validityData={currentValidityData}
                    />
                </GoalFormPopupTrigger>
            ))}
        </TableRow>
    );
};

interface CriteriaListProps
    extends Omit<GoalCriteriaEditableApi<UnionCriteria & { mode: CriteriaUpdateDataMode }>, 'validityData'> {
    list?: Array<CriteriaProps | GoalCriteriaProps | ExternalTaskCriteriaProps>;
    className?: string;
}

export const CriteriaList: React.FC<CriteriaListProps> = ({
    list = [],
    onConvert,
    onUpdate,
    onRemove,
    onCheck,
    onCheckJiraTask,
    goalId,
    className,
}) => {
    const validityData = useCriteriaValidityData(list);
    return (
        <Table className={classNames(classes.GoalCriteriaTable, className)}>
            {list.map((criteria) => (
                <Criteria
                    goalId={goalId}
                    key={criteria.id}
                    {...criteria}
                    onConvert={onConvert}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onCheck={onCheck}
                    onCheckJiraTask={onCheckJiraTask}
                    validityData={validityData}
                />
            ))}
        </Table>
    );
};

interface GoalCriteriaPreviewProps {
    view?: 'circle' | 'flat';
    achievedWeight: number;
    goalId: string;
}

export const GoalCriteriaPreview: React.FC<GoalCriteriaPreviewProps> = ({
    achievedWeight,
    goalId,
    view = 'circle',
}) => {
    const [popupVisible, setPopupVisible] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data, status } = trpc.goal.getGoalCriteriaList.useQuery({ id: goalId }, { enabled: popupVisible });

    useClickOutside(wrapperRef, ({ target }) => {
        if (!popupVisible) {
            return;
        }

        if (target instanceof HTMLElement) {
            if (!wrapperRef.current?.contains(target)) {
                setPopupVisible(false);
            }
        }
    });

    const handleOpen = useCallback(
        (e: MouseEvent<HTMLSpanElement>) => {
            // block following a link that hangs on the entire table row
            e.preventDefault();

            // block opening GoalPreview
            e.stopPropagation();

            if (!popupVisible) {
                setPopupVisible(true);
            }
        },
        [popupVisible],
    );

    return (
        <>
            <span ref={triggerRef} className={classes.GoalCriteriaTrigger} onClick={handleOpen}>
                {nullable(
                    view === 'circle',
                    () => (
                        <CircleProgressBar value={achievedWeight} />
                    ),
                    <FlatProgressBar value={achievedWeight} />,
                )}
            </span>
            <Popup
                reference={triggerRef}
                visible={popupVisible}
                placement="bottom-end"
                offset={[10, 10]}
                arrow={false}
                onClickCapture={() => setPopupVisible(false)}
                onClick={(e) => {
                    // block opening GoalPreview
                    e.stopPropagation();
                }}
            >
                <div className={classes.GoalCriteria} ref={wrapperRef}>
                    <Text className={classes.GoalCriteriaTitle} as="h4">
                        {tr('Achievement criteria')}
                    </Text>
                    {nullable(status === 'success', () => (
                        <CriteriaList
                            className={classes.GoalCriteriaTable}
                            goalId={goalId}
                            list={data?.map((criteria) =>
                                mapCriteria(criteria, criteria.criteriaGoal, criteria.externalTask),
                            )}
                        />
                    ))}
                    {nullable(status === 'loading', () => (
                        <div className={classes.GoalCriteriaLoader}>
                            <Badge iconLeft={<Spinner size="s" />} text={tr('Loading ...')} />
                        </div>
                    ))}
                </div>
            </Popup>
        </>
    );
};

interface GoalCriteriaViewProps
    extends Omit<GoalCriteriaEditableApi<UnionCriteria & { mode: CriteriaUpdateDataMode }>, 'validityData'> {
    goalId: string;
    list: Array<CriteriaProps | GoalCriteriaProps | ExternalTaskCriteriaProps>;
    canEdit: boolean;
}

export const GoalCriteriaView: React.FC<React.PropsWithChildren<GoalCriteriaViewProps>> = ({
    goalId,
    list,
    onUpdate,
    onRemove,
    onCheck,
    onCheckJiraTask,
    onConvert,
    children,
    canEdit,
}) => {
    const editableProps = useMemo(
        () =>
            canEdit
                ? {
                      onConvert,
                      onRemove,
                      onUpdate,
                      onCheck,
                      onCheckJiraTask,
                  }
                : {},
        [onConvert, onRemove, onUpdate, onCheck, onCheckJiraTask, canEdit],
    );

    return (
        <ActivityFeedItem className={classes.GoalCriteriaIsolate}>
            <Circle size={32} className={classes.GoalCriteriaCircle}>
                <IconMessageTickOutline size="s" />
            </Circle>
            <IssueMeta
                className={classNames(classes.GoalCriteriaIssueMeta, {
                    [classes.GoalCriteriaIssueMetaReset]: list.length === 0,
                })}
                title={list.length ? tr('Achievement criteria') : undefined}
            >
                {nullable(list, (l) => (
                    <CriteriaList goalId={goalId} list={l} {...editableProps} />
                ))}
                {children}
            </IssueMeta>
        </ActivityFeedItem>
    );
};
