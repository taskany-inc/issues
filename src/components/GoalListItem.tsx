import React, { MouseEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { textColor, gapS, gray9, radiusM } from '@taskany/colors';
import { Text, Tag as TagItem, nullable, CircleProgressBar, TableRow, TableCell } from '@taskany/bricks';
import { IconEyeOutline, IconStarSolid } from '@taskany/icons';
import type { State as StateType, Tag } from '@prisma/client';

import { routes } from '../hooks/router';
import { DateType } from '../types/date';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { formateEstimate } from '../utils/dateTime';
import { useLocale } from '../hooks/useLocale';
import { Priority } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { State } from './State';
import { RelativeTime } from './RelativeTime/RelativeTime';
import { WrappedRowLink } from './WrappedRowLink';
import { collapseOffset } from './CollapsableItem';
import { CommentsCountBadge } from './CommentsCountBadge';
import { TagsList } from './TagsList';

interface GoalListItemProps {
    id: string;
    shortId: string;
    projectId?: string | null;
    title: string;
    owner?: ActivityByIdReturnType | null;
    issuer?: ActivityByIdReturnType | null;
    participants?: ActivityByIdReturnType[];
    tags?: Array<Tag | undefined>;
    state?: StateType | null;
    createdAt: Date;
    updatedAt: Date;
    estimate?: Date | null;
    estimateType?: DateType | null;
    comments?: number;
    focused?: boolean;
    priority?: Priority | null;
    starred?: boolean;
    watching?: boolean;
    className?: string;
    achivedCriteriaWeight?: number | null;
    deep?: number;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
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

const StyledTableRow = styled(TableRow)`
    position: relative;
    padding: ${gapS};

    border-radius: ${radiusM};

    color: ${textColor};
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
            <StyledTagsCell ref={targetRef} col={1} onMouseOverCapture={onEnterHandler} hover={hovered}>
                <StyledTagsList>{children}</StyledTagsList>
            </StyledTagsCell>
        </>
    );
};

// px
const maxTitleColumnWidth = 420;

export const GoalListItem: React.FC<GoalListItemProps> = React.memo(
    ({
        shortId,
        owner,
        issuer,
        participants,
        updatedAt,
        projectId,
        tags,
        title,
        comments,
        state,
        focused,
        estimate,
        estimateType,
        priority,
        starred,
        watching,
        achivedCriteriaWeight,
        deep,
        onClick,
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

        const titleColumnWidth = maxTitleColumnWidth - (deep && deep > 0 ? deep : 0) * collapseOffset;

        return (
            <NextLink href={routes.goal(shortId)} passHref legacyBehavior>
                <WrappedRowLink>
                    <StyledTableRow
                        focused={focused}
                        className={className}
                        onClick={onClick}
                        gap={10}
                        align="center"
                        interactive
                    >
                        <TableCell width={titleColumnWidth}>
                            <Text size="m" weight="bold">
                                {title}
                            </Text>
                        </TableCell>

                        <TableCell col={1}>
                            {nullable(state, (s) => (
                                <State size="s" title={s?.title} hue={s?.hue} />
                            ))}
                        </TableCell>

                        <TableCell width="11ch">
                            {nullable(priority?.title, (title) => (
                                <GoalTextItem>{getPriorityText(title)}</GoalTextItem>
                            ))}
                        </TableCell>

                        {nullable(projectId, (pId) => (
                            <TableCell col={1}>
                                <GoalTextItem>{pId}</GoalTextItem>
                            </TableCell>
                        ))}

                        <TableCell align="center" width={32}>
                            <UserGroup users={issuers} />
                        </TableCell>

                        <TableCell width="8ch">
                            <GoalTextItem>
                                {nullable(estimate, (e) =>
                                    formateEstimate(e, {
                                        type: estimateType === 'Year' ? estimateType : 'Quarter',
                                        locale,
                                    }),
                                )}
                            </GoalTextItem>
                        </TableCell>

                        <TableCell width={24}>
                            {achivedCriteriaWeight != null && <CircleProgressBar value={achivedCriteriaWeight} />}
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

                        <TableCell width={90}>
                            {nullable(participants, (p) => (
                                <UserGroup users={p} />
                            ))}
                        </TableCell>

                        <TableCell width="6ch">
                            {nullable(comments, (c) => (
                                <GoalTextItem>
                                    <CommentsCountBadge count={c} />
                                </GoalTextItem>
                            ))}
                        </TableCell>

                        <TableCell col={1}>
                            <RelatedTextItem>
                                <RelativeTime date={updatedAt} />
                            </RelatedTextItem>
                        </TableCell>

                        <TableCell width={40} justify="between">
                            {nullable(starred, () => (
                                <IconStarSolid size="s" />
                            ))}
                            {nullable(watching, () => (
                                <IconEyeOutline size="s" />
                            ))}
                        </TableCell>
                    </StyledTableRow>
                </WrappedRowLink>
            </NextLink>
        );
    },
);
