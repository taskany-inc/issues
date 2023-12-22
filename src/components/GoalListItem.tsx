import React, { MouseEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { gray9 } from '@taskany/colors';
import { Text, Tag as TagItem, nullable, CircleProgressBar, TableRow, TableCell } from '@taskany/bricks';
import { IconEyeOutline, IconStarSolid } from '@taskany/icons';
import type { State as StateType, Tag } from '@prisma/client';

import { DateType } from '../types/date';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { formateEstimate } from '../utils/dateTime';
import { useLocale } from '../hooks/useLocale';
import { Priority } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { State } from './State';
import { RelativeTime } from './RelativeTime/RelativeTime';
import { CommentsCountBadge } from './CommentsCountBadge';
import { TagsList } from './TagsList';

interface GoalListItemProps {
    owner?: ActivityByIdReturnType | null;
    issuer?: ActivityByIdReturnType | null;
    participants?: ActivityByIdReturnType[];
    tags?: Array<Tag | undefined>;
    state?: StateType | null;
    updatedAt: Date;
    estimate?: Date | null;
    estimateType?: DateType | null;
    comments?: number;
    priority?: Priority | null;
    starred?: boolean;
    watching?: boolean;
    className?: string;
    achivedCriteriaWeight?: number | null;
    onTagClick?: (tag: Tag) => MouseEventHandler<HTMLDivElement>;
}

const GoalTextItem = styled(Text).attrs({
    size: 's',
    color: gray9,
})``;

const RelatedTextItem = styled(GoalTextItem).attrs({
    weight: 'regular',
})``;

const StyledTagsList = styled(TagsList)`
    flex-wrap: nowrap;
    white-space: nowrap;
`;

const StyledOverTagsContentWrapper = styled(StyledTagsList)<{ top: number; left: number; width: number }>`
    position: absolute;
    ${({ top, left, width }) => `
        min-width: ${width}px;
        top: ${top}px;
        left: ${left}px;
    `}
    z-index: 1;
`;

const StyledTagsCell = styled(TableCell)<{ hover?: boolean }>`
    overflow: hidden;

    ${({ hover }) =>
        hover != null &&
        `
        opacity: ${hover ? 0 : 1}

        &:hover ${StyledTagsList} {
            opacity: 0;
            visibility: hidden;
        }
    `}
`;

const TagsCell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });
    const [hovered, toggle] = useState<boolean | undefined>(undefined);
    const targetRef = useRef<HTMLDivElement>(null);

    const onEnterHandler = useCallback<React.MouseEventHandler<HTMLDivElement>>((event) => {
        const {
            currentTarget: { offsetTop, offsetLeft, offsetWidth, firstElementChild },
        } = event;

        if ((firstElementChild?.clientWidth ?? 0) > offsetWidth) {
            setRect({
                top: offsetTop,
                left: offsetLeft,
                width: offsetWidth,
            });
            toggle(true);
        }
    }, []);

    const onLeaveHandler = useCallback<React.MouseEventHandler<HTMLDivElement>>(() => {
        toggle((prev) => {
            if (prev == null) {
                return prev;
            }

            return false;
        });
        setRect({ top: 0, left: 0, width: 0 });
    }, []);

    return (
        <>
            {hovered && (
                <StyledOverTagsContentWrapper onMouseLeave={onLeaveHandler} {...rect}>
                    {children}
                </StyledOverTagsContentWrapper>
            )}
            <StyledTagsCell ref={targetRef} width="100px" onMouseOverCapture={onEnterHandler} hover={hovered}>
                <StyledTagsList>{children}</StyledTagsList>
            </StyledTagsCell>
        </>
    );
};

export const GoalListItem: React.FC<GoalListItemProps> = React.memo(
    ({
        owner,
        issuer,
        participants,
        updatedAt,
        tags,
        comments,
        state,
        estimate,
        estimateType,
        priority,
        starred,
        watching,
        achivedCriteriaWeight,
        className,
        onTagClick,
    }) => {
        const locale = useLocale();
        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }, [issuer, owner]);

        return (
            <TableRow className={className} gap={10} align="center">
                <TableCell width="90px">
                    {nullable(state, (s) => (
                        <State size="s" title={s?.title} hue={s?.hue} />
                    ))}
                </TableCell>

                <TableCell width="90px">
                    {nullable(priority?.title, (title) => (
                        <GoalTextItem>{getPriorityText(title)}</GoalTextItem>
                    ))}
                </TableCell>

                <TableCell width="40px">
                    <UserGroup users={issuers} />
                </TableCell>

                <TableCell width="60px">
                    <GoalTextItem>
                        {nullable(estimate, (e) =>
                            formateEstimate(e, {
                                type: estimateType === 'Year' ? estimateType : 'Quarter',
                                locale,
                            }),
                        )}
                    </GoalTextItem>
                </TableCell>

                <TableCell width="30px">
                    {nullable(achivedCriteriaWeight, (weight) => (
                        <CircleProgressBar value={weight} />
                    ))}
                </TableCell>

                <TagsCell>
                    {nullable(tags, (t) =>
                        t.map((tag) =>
                            nullable(tag, (item) => (
                                <TagItem key={item.id} onClick={onTagClick?.(item)}>
                                    {item.title}
                                </TagItem>
                            )),
                        ),
                    )}
                </TagsCell>

                <TableCell width="90px">
                    {nullable(participants, (p) => (
                        <UserGroup users={p} />
                    ))}
                </TableCell>

                <TableCell width="40px">
                    {nullable(comments, (c) => (
                        <GoalTextItem>
                            <CommentsCountBadge count={c} />
                        </GoalTextItem>
                    ))}
                </TableCell>

                <TableCell width="110px">
                    <RelatedTextItem>
                        <RelativeTime date={updatedAt} />
                    </RelatedTextItem>
                </TableCell>

                <TableCell width="40px" justify="between">
                    {nullable(starred, () => (
                        <IconStarSolid size="s" />
                    ))}
                    {nullable(watching, () => (
                        <IconEyeOutline size="s" />
                    ))}
                </TableCell>
            </TableRow>
        );
    },
);
