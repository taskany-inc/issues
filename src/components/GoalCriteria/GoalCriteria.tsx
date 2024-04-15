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
} from '@taskany/bricks/harmony';
import { backgroundColor, danger0 } from '@taskany/colors';
import { Spinner, nullable, useClickOutside } from '@taskany/bricks';
import {
    IconBinOutline,
    IconEdit1Outline,
    IconMessageTickOutline,
    IconMoreVerticalOutline,
    IconTargetOutline,
} from '@taskany/icons';
import classNames from 'classnames';

import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { trpc } from '../../utils/trpcClient';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger/GoalFormPopupTrigger';
import { useGoalResource } from '../../hooks/useGoalResource';
import { ActivityFeedItem } from '../ActivityFeed/ActivityFeed';
import { IssueMeta } from '../IssueMeta';
import { Circle } from '../Circle/Circle';
import { routes } from '../../hooks/router';
import { GoalBadge } from '../GoalBadge';
import { State } from '../../../trpc/inferredTypes';

import classes from './GoalCriteria.module.css';
import { tr } from './GoalCriteria.i18n';

type GoalCriteriaSuggestProps = React.ComponentProps<typeof GoalCriteriaSuggest>;

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
        state?: State | null;
    };
}

type UnionCriteria = CriteriaProps | GoalCriteriaProps;

interface GoalCriteriaEditableApi<T = UnionCriteria> {
    onCreate?: (val: T) => void;
    onUpdate?: (val: T) => void;
    onConvert?: (val: T) => void;
    onRemove?: (val: T) => void;
    onCheck?: (val: T) => void;
    goalId: string;
}

export function mapCriteria<
    T extends CriteriaProps,
    G extends { id: string; _shortId: string; title: string; state?: State | null },
>(criteria: T, connectedGoal: G | null): UnionCriteria {
    if (connectedGoal) {
        return {
            id: criteria.id,
            goal: {
                goalId: connectedGoal.id,
                state: connectedGoal.state,
                shortId: connectedGoal._shortId,
            },
            title: connectedGoal.title,
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
        <TableCell width={350}>
            <Checkbox
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

const GoalCriteria = ({ title, goal, weight }: Omit<GoalCriteriaProps, 'id'>) => {
    const { setPreview } = useGoalPreview();

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
            <TableCell width={350}>
                <GoalBadge
                    title={title}
                    state={goal.state ?? undefined}
                    href={routes.goal(goal.shortId)}
                    onClick={handleGoalCriteriaClick}
                />
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
    color?: string;
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
                    {actions.map(({ icon, label, handler, color }) => (
                        <MenuItem
                            key={label}
                            className={classes.GoalCriteriaActionsItem}
                            onClick={handleActionClick(handler)}
                        >
                            <Badge iconLeft={icon} text={label} color={color} weight="regular" />
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

export const Criteria: React.FC<UnionCriteria & GoalCriteriaEditableApi> = ({
    onConvert,
    onRemove,
    onUpdate,
    onCheck,
    ...props
}) => {
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

        if (!criteriaAsGoal(props) && onConvert) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xs" />,
                handler: () => onConvert(props),
            });
        }

        if (onRemove) {
            actions.push({
                label: tr('Delete'),
                icon: <IconBinOutline size="xs" color={danger0} />,
                color: danger0,
                handler: () => onRemove(props),
            });
        }

        return actions;
    }, [onConvert, onRemove, onUpdate, props]);

    const handleCriteriaCheck = useCallback(() => {
        if (onCheck) {
            return () => {
                onCheck({ ...props, isDone: !props.isDone });
            };
        }

        return undefined;
    }, [props, onCheck]);

    const [defaultMode, values]: ['simple' | 'goal', React.ComponentProps<typeof GoalCriteriaSuggest>['values']] =
        useMemo(() => {
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
            const valuesToUpdate: UnionCriteria = {
                id: props.id,
                title: values.title,
                weight: Number(values.weight),
                isDone: props.isDone,
            };

            if (values.selected?.id != null) {
                (valuesToUpdate as GoalCriteriaProps).goal = {
                    goalId: values.selected.id,
                    shortId: values.selected._shortId,
                    state: values.selected.state,
                };
                valuesToUpdate.title = values.selected.title;
            }

            if (onUpdate) {
                onUpdate(valuesToUpdate);
            }
        },
        [onUpdate, props.id, props.isDone],
    );

    return (
        <TableRow className={classes.GoalCriteriaTableRow}>
            {criteriaAsGoal(props) ? (
                <GoalCriteria title={props.title} weight={props.weight} isDone={props.isDone} goal={props.goal} />
            ) : (
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
                >
                    <GoalCriteriaSuggest
                        id={props.goalId}
                        defaultMode={defaultMode}
                        values={values}
                        onSubmit={handleCriteriaUpdate}
                        validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                    />
                </GoalFormPopupTrigger>
            ))}
        </TableRow>
    );
};

interface CriteriaListProps extends GoalCriteriaEditableApi {
    list?: Array<CriteriaProps | GoalCriteriaProps>;
    className?: string;
}

export const CriteriaList: React.FC<CriteriaListProps> = ({
    list = [],
    onConvert,
    onUpdate,
    onRemove,
    onCheck,
    goalId,
    className,
}) => {
    return (
        <Table className={className}>
            {list.map((criteria) => (
                <Criteria
                    goalId={goalId}
                    key={criteria.id}
                    {...criteria}
                    onConvert={onConvert}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onCheck={onCheck}
                />
            ))}
        </Table>
    );
};

interface GoalCriteriaPreviewProps {
    achievedWeight: number;
    goalId: string;
}

export const GoalCriteriaPreview: React.FC<GoalCriteriaPreviewProps> = ({ achievedWeight, goalId }) => {
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
                <CircleProgressBar value={achievedWeight} />
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
                            list={data?.map((criteria) => mapCriteria(criteria, criteria.criteriaGoal))}
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

interface CriteriaItemValue {
    id: string;
    title: string;
    weight: number;
    isDone: boolean;
    criteriaGoal: {
        id: string;
        title: string;
        _shortId: string;
        state?: State | null;
    } | null;
}

interface GoalCriteriaViewProps extends GoalCriteriaEditableApi<UnionCriteria> {
    goalId: string;
    list: Array<CriteriaProps | GoalCriteriaProps>;
    canEdit: boolean;
}

export const GoalCriteriaView: React.FC<React.PropsWithChildren<GoalCriteriaViewProps>> = ({
    goalId,
    list,
    onUpdate,
    onRemove,
    onCheck,
    onConvert,
    children,
    canEdit,
}) => {
    const sortedCriteriaItems = useMemo(() => {
        const sorted = list.reduce<Record<'done' | 'undone', UnionCriteria[]>>(
            (acc, criteria) => {
                if (criteria.isDone) {
                    acc.done.push(criteria);
                } else {
                    acc.undone.push(criteria);
                }

                return acc;
            },
            {
                done: [],
                undone: [],
            },
        );

        return sorted.done.concat(sorted.undone);
    }, [list]);

    const mapCriteriaValueWrapper = useCallback((fn?: (val: CriteriaItemValue) => void | Promise<void>) => {
        if (fn) {
            return (data: UnionCriteria) => {
                const returnedItem: CriteriaItemValue = {
                    id: data.id,
                    title: data.title,
                    weight: Number(data.weight),
                    isDone: data.isDone,
                    criteriaGoal: null,
                };

                if (criteriaAsGoal(data)) {
                    returnedItem.criteriaGoal = {
                        id: data.goal.goalId,
                        title: data.title,
                        _shortId: data.goal.shortId,
                        state: data.goal.state,
                    };
                }

                return fn(returnedItem);
            };
        }
    }, []);

    const editableProps = useMemo(
        () =>
            canEdit
                ? {
                      onConvert: mapCriteriaValueWrapper(onConvert),
                      onRemove: mapCriteriaValueWrapper(onRemove),
                      onUpdate: mapCriteriaValueWrapper(onUpdate),
                      onCheck: mapCriteriaValueWrapper(onCheck),
                  }
                : {},
        [onConvert, onRemove, onUpdate, onCheck, canEdit, mapCriteriaValueWrapper],
    );

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <IconMessageTickOutline size="s" color={backgroundColor} />
            </Circle>
            <IssueMeta
                className={classNames(classes.GoalCriteriaIssueMeta, {
                    [classes.GoalCriteriaIssueMetaReset]: sortedCriteriaItems.length === 0,
                })}
                title={sortedCriteriaItems.length ? tr('Achievement criteria') : undefined}
            >
                {nullable(sortedCriteriaItems, (list) => (
                    <CriteriaList goalId={goalId} list={list} {...editableProps} />
                ))}
                {children}
            </IssueMeta>
        </ActivityFeedItem>
    );
};
