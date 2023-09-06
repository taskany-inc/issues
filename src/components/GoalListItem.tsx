import React, { MouseEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { textColor, gapS, gapXs, gray9, radiusM } from '@taskany/colors';
import { Text, Tag as TagItem, nullable, CircleProgressBar, TableRow, TableCell } from '@taskany/bricks';
import { IconEyeOutline, IconStarSolid, IconMessageOutline } from '@taskany/icons';
import type { State as StateType, Tag } from '@prisma/client';

import { routes } from '../hooks/router';
import { Priority } from '../types/priority';
import { DateType } from '../types/date';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { formateEstimate } from '../utils/dateTime';
import { useLocale } from '../hooks/useLocale';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { State } from './State';
import { RelativeTime } from './RelativeTime/RelativeTime';
import { WrappedRowLink } from './WrappedRowLink';
import { collapseOffset } from './CollapsableItem';

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
    isNotViewed?: boolean;
    focused?: boolean;
    priority?: string | null;
    starred?: boolean;
    watching?: boolean;
    className?: string;
    achivedCriteriaWeight?: number | null;
    deep?: number;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: Tag) => MouseEventHandler<HTMLDivElement>;
}

const GoalTitleItem = styled(TableCell)`
    overflow: hidden;
    white-space: normal;
`;

const GoalTitleContainer = styled.div`
    display: flex;
`;

const NotViewedDot = styled.div`
    align-self: center;
    justify-self: center;
    width: 5px;
    height: 5px;

    margin-right: ${gapXs};

    background-color: ${textColor};

    border-radius: 100%;
`;

const GoalTitle = styled(Text)`
    margin-right: ${gapS};
    text-overflow: ellipsis;
    overflow: hidden;
`;

const StyledGoalTag = styled(TagItem)`
    margin: calc(${gapXs} / 2) 0;
    margin-right: ${gapXs};

    & + & {
        margin-left: 0;
    }
    &:last-child {
        margin-right: 0;
    }
`;

const CommentsCountContainer = styled.div`
    white-space: nowrap;
`;

const CommentsCount = styled(Text)`
    display: inline-block;
    margin-left: ${gapXs};
    vertical-align: middle;
`;

const CommentsCountIcon = styled(IconMessageOutline)`
    display: inline-block;
    vertical-align: middle;
`;

const GoalTextItem = styled(Text).attrs({
    size: 's',
    color: gray9,
})``;

const RelatedTextItem = styled(GoalTextItem).attrs({
    weight: 'regular',
})``;

const StyledOverTagsContentWrapper = styled.div<{ top: number; left: number; width: number }>`
    position: absolute;
    ${({ top, left, width }) => `
        min-width: ${width}px;
        top: ${top}px;
        left: ${left}px;
    `}
    bottom: auto;
    right: auto;

    max-width: 150%;
    width: 100%;

    display: flex;
    overflow: visible;
    flex-wrap: wrap;

    z-index: 1;
`;

const StyledNowrap = styled.span`
    white-space: nowrap;
`;

const StyledTagsCell = styled(TableCell)<{ hover?: boolean }>`
    display: flex;
    flex-wrap: nowrap;
    overflow: hidden;

    position: relative;

    ${({ hover }) =>
        hover != null &&
        `
        opacity: ${hover ? 0 : 1}

        &:hover ${StyledNowrap} {
            opacity: 0;
            visibility: hidden;
        }
    `}
`;

const StyledTableRow = styled(TableRow)`
    position: relative;
    text-decoration: none;
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
                <StyledNowrap>{children}</StyledNowrap>
            </StyledTagsCell>
        </>
    );
};

// px
const maxTitleColumnWidth = 400;

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
        isNotViewed,
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

        const titleColumnWidth = maxTitleColumnWidth - (deep ?? 0) * collapseOffset;

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
                        <GoalTitleItem width={titleColumnWidth}>
                            <GoalTitleContainer>
                                {isNotViewed && <NotViewedDot />}
                                <GoalTitle size="m" weight="bold">
                                    {title}
                                </GoalTitle>
                            </GoalTitleContainer>
                        </GoalTitleItem>

                        <TableCell col={1}>
                            {nullable(state, (s) => (
                                <State size="s" title={s?.title} hue={s?.hue} />
                            ))}
                        </TableCell>

                        <TableCell width="11ch">
                            <GoalTextItem>{getPriorityText(priority as Priority)}</GoalTextItem>
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
                                        <StyledGoalTag key={item.id} onClick={onTagClick?.(item)}>
                                            {item.title}
                                        </StyledGoalTag>
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
                            {comments !== 0 && (
                                <CommentsCountContainer>
                                    <CommentsCountIcon size="s" />
                                    <CommentsCount size="xs" weight="bold">
                                        {comments}
                                    </CommentsCount>
                                </CommentsCountContainer>
                            )}
                        </TableCell>

                        <TableCell col={1} justify="end">
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
