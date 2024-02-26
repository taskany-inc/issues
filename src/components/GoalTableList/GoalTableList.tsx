import { Badge, State, Table, Tag, Text, User, UserGroup } from '@taskany/bricks/harmony';
import { MouseEventHandler, useMemo } from 'react';
import { Link, ListViewItem, nullable } from '@taskany/bricks';
import { IconMessageTextOutline } from '@taskany/icons';

import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { StateWrapper } from '../StateWrapper';
import { safeUserData } from '../../utils/getUserName';
import { calculateElapsedDays, formateEstimate } from '../../utils/dateTime';
import { getPriorityText } from '../PriorityText/PriorityText';
import { useLocale } from '../../hooks/useLocale';
import { NextLink } from '../NextLink';
import { routes } from '../../hooks/router';
import { TagsList } from '../TagsList';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { GoalCriteriaPreview } from '../NewGoalCriteria/NewGoalCriteria';

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
                                selected={selectedGoalResolver?.(row.goal?.id as string)}
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
