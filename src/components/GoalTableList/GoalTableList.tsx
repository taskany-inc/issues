import { Badge, Table, Tag, Text, UserGroup, ListViewItem, Tooltip } from '@taskany/bricks/harmony';
import { ComponentProps, MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { nullable, formateEstimate } from '@taskany/bricks';
import { IconGitBranchOutline, IconMessageTextOutline } from '@taskany/icons';
import { ReactSortable } from 'react-sortablejs';
import cn from 'classnames';

import { DateType } from '../../utils/db/generated/kysely/types';
import { State as StateType } from '../../../trpc/inferredTypes';
import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { safeUserData } from '../../utils/getUserName';
import { calculateElapsedDays } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { useLocale } from '../../hooks/useLocale';
import { NextLink } from '../NextLink';
import { routes } from '../../hooks/router';
import { TagsList } from '../TagsList/TagsList';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { InlineUserBadge } from '../InlineUserBadge/InlineUserBadge';
import { State } from '../State';
import { GoalCriteriaPreview } from '../GoalCriteria/GoalCriteria';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { participants, goalTableListItem } from '../../utils/domObjects';
import { trpc } from '../../utils/trpcClient';

import s from './GoalTableList.module.css';

interface GoalTableListProps<T> extends React.ComponentProps<typeof Table> {
    goals: T[];
    onGoalPreviewShow?: (goal: T) => MouseEventHandler<HTMLAnchorElement>;
    onGoalClick?: MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: { id: string }) => MouseEventHandler<HTMLDivElement>;
    enableManualSorting: boolean;
    invalidateGoals: VoidFunction;
}

interface IdentifierRecord {
    id: string;
    title: string;
}

interface GoalTableListItem extends IdentifierRecord {
    shortId: string;
    commentsCount?: number;
    tags: Array<IdentifierRecord> | null;
    updatedAt: Date;
    owner: ReturnType<typeof safeUserData>;
    participants?: Array<ReturnType<typeof safeUserData>>;
    state: StateType | null;
    estimate?: { value: Date; type: 'Strict' | 'Quarter' | 'Year' | null } | null;
    priority?: string | null;
    achievedCriteriaWeight?: number | null;
    project?: IdentifierRecord | null;
    isInPartnerProject?: boolean;
    _isEditable: boolean;
}

export const GoalTableList = <T extends GoalTableListItem>({
    goals,
    onGoalClick,
    onTagClick,
    enableManualSorting,
    invalidateGoals,
    ...attrs
}: GoalTableListProps<T>) => {
    const locale = useLocale();
    const { shortId, preview, setPreview, on } = useGoalPreview();

    useEffect(() => {
        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = goals.find(({ shortId }) => shortId === updatedId);
            if (idInList) {
                setPreview(null);
            }
        });

        return () => {
            unsubDelete();
        };
    }, [goals, preview, setPreview, on]);

    const onGoalPreviewShow = useCallback(
        (goal: Parameters<typeof setPreview>[1]): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey || !goal?._shortId) return;

                e.preventDefault();
                setPreview(goal._shortId, goal);
                onGoalClick?.(e);
            },
        [setPreview, onGoalClick],
    );

    const updateGoalRankMutation = trpc.v2.goal.updateRank.useMutation();

    const onSortableMove = useCallback<NonNullable<ComponentProps<typeof ReactSortable>['onMove']>>(
        (event) => {
            if (enableManualSorting && event.dragged.classList.contains(s.SortableListItem_enable)) {
                return true;
            }
            return false;
        },
        [enableManualSorting],
    );

    const onDragEnd = useCallback<NonNullable<ComponentProps<typeof ReactSortable>['onEnd']>>(
        async (result) => {
            const {
                item: { id: goalId },
                oldIndex,
                newIndex,
            } = result;

            if (oldIndex === undefined || newIndex === undefined) return;

            const lowGoal = newIndex < oldIndex ? goals[newIndex - 1] : goals[newIndex];
            const highGoal = newIndex < oldIndex ? goals[newIndex] : goals[newIndex + 1];

            await updateGoalRankMutation.mutateAsync({
                id: goalId,
                low: lowGoal?.id,
                high: highGoal?.id,
                global: true,
            });

            invalidateGoals?.();
        },
        [goals, updateGoalRankMutation, invalidateGoals],
    );

    const data = useMemo(
        () =>
            goals.map((goal) => {
                return {
                    id: goal.id,
                    goal,
                    list: [
                        {
                            content: (
                                <>
                                    <Text className={s.GoalTitle}>
                                        {nullable(goal.isInPartnerProject && goal.project?.title, (title) => (
                                            <Tooltip
                                                placement="bottom"
                                                target={
                                                    <Badge
                                                        className={s.GoalTitlePartnterIcon}
                                                        size="s"
                                                        weight="regular"
                                                        iconLeft={<IconGitBranchOutline size="s" />}
                                                    />
                                                }
                                            >
                                                {title}
                                            </Tooltip>
                                        ))}
                                        {goal.title}
                                    </Text>
                                    {nullable(goal.tags, (tags) => (
                                        <TagsList>
                                            {tags.map((tag) => (
                                                <Tag key={tag.id} onClick={onTagClick?.({ id: tag.id })}>
                                                    {tag.title}
                                                </Tag>
                                            ))}
                                        </TagsList>
                                    ))}
                                    {nullable(
                                        goal.updatedAt,
                                        (date) =>
                                            calculateElapsedDays(date) === 0 && (
                                                <RelativeTime date={date} kind="Updated" className={s.RelativeTime} />
                                            ),
                                    )}
                                </>
                            ),
                            className: s.TableListItemTitle,
                        },
                        {
                            content: nullable(goal.commentsCount, (count) => (
                                <Badge
                                    size="s"
                                    weight="regular"
                                    text={count}
                                    iconLeft={<IconMessageTextOutline size="s" />}
                                />
                            )),
                            width: 40,
                            className: s.GoalTableColumnSecondary,
                        },
                        {
                            content: nullable(goal.state, (s) => <State state={s} />),
                            width: 130,
                        },
                        {
                            content: nullable(goal.owner, (user) => (
                                <InlineUserBadge
                                    className={s.Owner}
                                    name={user.name}
                                    image={user.image}
                                    email={user.email}
                                    tooltip={user.name}
                                    ellipsis
                                />
                            )),
                            width: 172,
                            className: s.GoalTableColumnSecondary,
                        },
                        {
                            content: nullable(goal.participants?.filter(Boolean), (participantsList) => (
                                <span {...participants.attr}>
                                    <UserGroup users={participantsList} />
                                </span>
                            )),
                            width: 100,
                        },
                        {
                            content: nullable(goal.estimate, (estimate) => (
                                <Text size="s">
                                    {formateEstimate(estimate.value, {
                                        type: estimate.type === 'Year' ? estimate.type : 'Quarter',
                                        locale,
                                    })}
                                </Text>
                            )),
                            width: 95,
                            className: s.GoalTableColumnSecondary,
                        },
                        {
                            content: nullable(goal.priority, (priority) => (
                                <Text size="s">{getPriorityText(priority)}</Text>
                            )),
                            width: 90,
                            className: s.GoalTableColumnSecondary,
                        },
                        {
                            content: goal.achievedCriteriaWeight != null && goal.id != null && (
                                <GoalCriteriaPreview achievedWeight={goal.achievedCriteriaWeight} goalId={goal.id} />
                            ),
                            width: 32,
                        },
                    ],
                };
            }),
        [goals, locale, onTagClick],
    );

    const [list, setList] = useState(data);

    useEffect(() => {
        setList(data);
    }, [data]);

    return (
        <Table {...attrs}>
            <ReactSortable
                list={list}
                setList={setList}
                className={s.SortableContainer}
                onMove={onSortableMove}
                onEnd={onDragEnd}
            >
                {list.map((row) => {
                    const { project: _, ...goal } = row.goal;

                    return (
                        <NextLink
                            id={goal.id}
                            key={goal.id}
                            href={routes.goal(goal.shortId as string)}
                            onClick={onGoalPreviewShow({
                                _shortId: goal.shortId,
                                title: goal.title,
                                state: goal.state,
                            })}
                            className={cn({
                                [s.SortableListItem_enable]: enableManualSorting && goal._isEditable,
                            })}
                        >
                            <ListViewItem
                                value={row.goal}
                                renderItem={({ active, hovered: _, ...props }) => (
                                    <TableListItem
                                        selected={goal.shortId === shortId || goal.id === preview?.id}
                                        hovered={active}
                                        {...goalTableListItem.attr}
                                        {...props}
                                    >
                                        {row.list.map(({ content, width, className }, index) => (
                                            <TableListItemElement key={index} width={width} className={className}>
                                                {content}
                                            </TableListItemElement>
                                        ))}
                                    </TableListItem>
                                )}
                            />
                        </NextLink>
                    );
                })}
            </ReactSortable>
        </Table>
    );
};

type GoalSource = IdentifierRecord & {
    priority: IdentifierRecord | null;
    estimate: Date | null;
    estimateType: DateType | null;
    [key: string]: unknown;
};

export function mapToRenderProps<T extends GoalSource>(
    goals: T[],
    mapper: <T1 extends T>(val: T1 & Pick<GoalTableListItem, 'priority' | 'estimate'>) => GoalTableListItem,
): GoalTableListItem[] {
    return goals.map((v) =>
        mapper({
            ...v,
            priority: v.priority?.title,
            estimate: v.estimate
                ? {
                      value: v.estimate,
                      type: v.estimateType,
                  }
                : null,
        }),
    );
}
