import { Badge, State, Table, Tag, Text, User, UserGroup } from '@taskany/bricks/harmony';
import { MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import { Link, ListViewItem, nullable } from '@taskany/bricks';
import { IconMessageTextOutline } from '@taskany/icons';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { StateWrapper } from '../StateWrapper/StateWrapper';
import { safeUserData } from '../../utils/getUserName';
import { calculateElapsedDays, formateEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { useLocale } from '../../hooks/useLocale';
import { NextLink } from '../NextLink';
import { routes } from '../../hooks/router';
import { TagsList } from '../TagsList/TagsList';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { GoalCriteriaPreview } from '../NewGoalCriteria/NewGoalCriteria';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';

import s from './GoalTableList.module.css';

interface GoalTableListProps<T> {
    goals: T[];
    onGoalPreviewShow?: (goal: T) => MouseEventHandler<HTMLAnchorElement>;
    onGoalClick?: MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: { id: string }) => MouseEventHandler<HTMLDivElement>;
}

export const GoalTableList = <T extends Partial<NonNullable<GoalByIdReturnType>>>({
    goals,
    onGoalClick,
    onTagClick,
    ...attrs
}: GoalTableListProps<T>) => {
    const locale = useLocale();
    const { shortId, preview, setPreview, on } = useGoalPreview();

    useEffect(() => {
        const unsubDelete = on('on:goal:delete', (updatedId) => {
            const idInList = goals.find(({ _shortId }) => _shortId === updatedId);
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

    const data = useMemo(
        () =>
            goals.map((goal) => ({
                goal,
                list: [
                    {
                        content: (
                            <>
                                <Text className={s.GoalTitle}>{goal.title}</Text>
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
                        content: nullable(goal._count?.comments, (count) => (
                            <Badge
                                size="s"
                                weight="regular"
                                text={count?.toString()}
                                iconLeft={<IconMessageTextOutline size="s" />}
                            />
                        )),
                        width: 40,
                        className: s.GoalTableColumnSecondary,
                    },
                    {
                        content: (
                            <StateWrapper hue={goal.state?.hue}>
                                <State color="var(--state-stroke)" title={goal.state?.title} />
                            </StateWrapper>
                        ),
                        width: 130,
                    },
                    {
                        content: nullable(safeUserData(goal.owner), (user) => (
                            <User
                                className={s.Owner}
                                name={user.name}
                                src={user.image}
                                email={user.email}
                                inheritColor
                            />
                        )),
                        width: 172,
                        className: s.GoalTableColumnSecondary,
                    },
                    {
                        content: nullable(goal.participants?.map(safeUserData).filter(Boolean), (participants) => (
                            <UserGroup users={participants} />
                        )),
                        width: 100,
                    },
                    {
                        content: nullable(goal.estimate, (estimate) => (
                            <Text size="s">
                                {formateEstimate(estimate, {
                                    type: goal.estimateType === 'Year' ? goal.estimateType : 'Quarter',
                                    locale,
                                })}
                            </Text>
                        )),
                        width: 95,
                        className: s.GoalTableColumnSecondary,
                    },
                    {
                        content: nullable(goal.priority?.title, (title) => (
                            <Text size="s">{getPriorityText(title)}</Text>
                        )),
                        width: 90,
                        className: s.GoalTableColumnSecondary,
                    },
                    {
                        content: goal._achivedCriteriaWeight != null && goal.id != null && (
                            <GoalCriteriaPreview achievedWeight={goal._achivedCriteriaWeight} goalId={goal.id} />
                        ),
                        width: 24,
                    },
                ],
            })),
        [goals, locale, onTagClick],
    );

    return (
        <Table {...attrs}>
            {data.map((row) => (
                <Link
                    key={row.goal.id}
                    as={NextLink}
                    href={routes.goal(row.goal?._shortId as string)}
                    onClick={onGoalPreviewShow(row.goal)}
                    inline
                >
                    <ListViewItem
                        value={row.goal}
                        renderItem={({ active, hovered: _, ...props }) => (
                            <TableListItem
                                selected={row.goal._shortId === shortId || row.goal.id === preview?.id}
                                hovered={active}
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
                </Link>
            ))}
        </Table>
    );
};
