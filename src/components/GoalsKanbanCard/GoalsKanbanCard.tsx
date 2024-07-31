import { FC, HTMLAttributes, MouseEventHandler, useMemo } from 'react';
import {
    Badge,
    KanbanCard,
    KanbanCardContent,
    KanbanCardContentItem,
    KanbanCardInfo,
    KanbanCardTitle,
    Tag,
} from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconMessageTextOutline } from '@taskany/icons';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { safeUserData } from '../../utils/getUserName';
import { DateType } from '../../types/date';
import { Priority } from '../../types/priority';
import { TagObject } from '../../types/tag';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { getDateString } from '../../utils/dateTime';
import { EstimateDropdown } from '../EstimateDropdown/EstimateDropdown';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { TagsList } from '../TagsList/TagsList';
import { GoalCriteriaPreview } from '../GoalCriteria/GoalCriteria';

import s from './GoalsKanbanCard.module.css';

interface GoalsKanbanCardProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    title: string;
    commentsCount: number;
    updatedAt: Date;
    owner?: ActivityByIdReturnType | null;
    estimate?: Date | null;
    estimateType?: DateType | null;
    tags?: TagObject[];
    onTagClick?: (tag: { id: string }) => MouseEventHandler<HTMLDivElement>;
    priority?: Priority | null;
    progress: number | null;
}

export const GoalsKanbanCard: FC<GoalsKanbanCardProps> = ({
    id,
    title,
    commentsCount,
    updatedAt,
    owner,
    estimate,
    estimateType,
    priority,
    tags,
    onTagClick,
    className,
    progress,
    ...rest
}) => {
    const ownerValue = useMemo(() => {
        const ownerData = safeUserData(owner);

        return ownerData ? { id: ownerData.id, user: ownerData } : undefined;
    }, [owner]);

    return (
        <KanbanCard className={className} {...rest}>
            <KanbanCardTitle>{title}</KanbanCardTitle>
            <KanbanCardInfo>
                <Badge size="s" weight="regular" text={commentsCount} iconLeft={<IconMessageTextOutline size="s" />} />
                <RelativeTime kind="updated" date={updatedAt} />
            </KanbanCardInfo>
            {nullable(tags, (t) => (
                <TagsList className={s.GoalsKanbanCardTags}>
                    {t.map((tag) => (
                        <Tag key={tag.id} onClick={onTagClick?.({ id: tag.id })}>
                            {tag.title}
                        </Tag>
                    ))}
                </TagsList>
            ))}
            <KanbanCardContent>
                <KanbanCardContentItem>
                    <UserDropdown
                        className={s.GoalsKanbanCardDropdown}
                        mode="single"
                        value={ownerValue}
                        label="Owner"
                        view="outline"
                        readOnly
                    />
                </KanbanCardContentItem>
            </KanbanCardContent>

            <KanbanCardContent>
                <KanbanCardContentItem>
                    <EstimateDropdown
                        value={estimate ? { date: getDateString(estimate), type: estimateType ?? 'Strict' } : undefined}
                        label="Estimate"
                        view="outline"
                        readOnly
                    />
                </KanbanCardContentItem>
                <KanbanCardContentItem>
                    <PriorityDropdown
                        mode="single"
                        label="Priority"
                        value={priority ?? undefined}
                        view="outline"
                        readOnly
                    />
                </KanbanCardContentItem>
            </KanbanCardContent>
            {progress !== null ? <GoalCriteriaPreview view="flat" achievedWeight={progress} goalId={id} /> : null}
        </KanbanCard>
    );
};
