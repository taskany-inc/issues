import { Badge, CircleProgressBar, State, Table, TableCell, Tag, Text, User, UserGroup } from '@taskany/bricks/harmony';
import { MouseEventHandler, useMemo } from 'react';
import cn from 'classnames';
import { Link, ListViewItem, nullable } from '@taskany/bricks';
import { IconMessageTextOutline } from '@taskany/icons';

import { GoalListItem } from '../GoalListItem/GoalListItem';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { safeUserData } from '../../utils/getUserName';
import { calculateElapsedDays, formateEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { useLocale } from '../../hooks/useLocale';
import { NextLink } from '../NextLink';
import { routes } from '../../hooks/router';
import { TagsList } from '../TagsList';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { usePageContext } from '../../hooks/usePageContext';

import s from './GoalTableList.module.css';

interface GoalTableListProps<T> {
    goals: T[];
    selectedGoalResolver?: (id: string) => boolean;
    onGoalPreviewShow: (goal: T) => MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: { id: string }) => MouseEventHandler<HTMLDivElement>;
}

export const GoalTableList = <T extends Partial<NonNullable<GoalByIdReturnType>>>({
    goals,
    selectedGoalResolver,
    onGoalPreviewShow,
    onTagClick,
    ...attrs
}: GoalTableListProps<T>) => {
    const locale = useLocale();
    const { theme } = usePageContext();

    const data = useMemo(
        () =>
            goals.map((goal) => ({
                goal,
                list: [
                    {
                        content: (
                            <>
                                <Text>{goal.title}</Text>
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
                        className: s.Title,
                    },
                    {
                        content: nullable(goal._count?.comments, (count) => (
                            <Badge
                                color="inherit"
                                size="s"
                                weight="regular"
                                text={count?.toString()}
                                iconLeft={<IconMessageTextOutline size="s" />}
                            />
                        )),
                        width: 40,
                    },
                    {
                        content: (
                            <State color={goal.state?.[`${theme}Foreground`] || undefined} title={goal.state?.title} />
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
                    },
                    {
                        content: nullable(goal.participants?.map(safeUserData).filter(Boolean), (participants) => (
                            <UserGroup users={participants} />
                        )),
                        width: 100,
                    },
                    {
                        content: nullable(goal.estimate, (estimate) => (
                            <Text size="s" color="inherit">
                                {formateEstimate(estimate, {
                                    type: goal.estimateType === 'Year' ? goal.estimateType : 'Quarter',
                                    locale,
                                })}
                            </Text>
                        )),
                        width: 95,
                    },
                    {
                        content: nullable(goal.priority?.title, (title) => (
                            <Text size="s" color="inherit">
                                {getPriorityText(title)}
                            </Text>
                        )),
                        width: 90,
                    },
                    {
                        content: nullable(goal._achivedCriteriaWeight, (weight) => (
                            <CircleProgressBar value={weight} />
                        )),
                        width: 24,
                    },
                ],
            })),
        [goals, locale, onTagClick, theme],
    );

    return (
        <Table {...attrs}>
            {data.map((row) => (
                <Link key={row.goal.id} as={NextLink} href={routes.goal(row.goal?._shortId as string)} inline>
                    <ListViewItem
                        value={row.goal}
                        renderItem={({ active, hovered: _, ...props }) => (
                            <GoalListItem
                                onClick={onGoalPreviewShow(row.goal)}
                                selected={selectedGoalResolver?.(row.goal?.id as string)}
                                hovered={active}
                                {...props}
                            >
                                {row.list.map(({ content, width, className }, index) => (
                                    <TableCell key={index} width={width} className={cn(s.Column, className)}>
                                        {content}
                                    </TableCell>
                                ))}
                            </GoalListItem>
                        )}
                    />
                </Link>
            ))}
        </Table>
    );
};
