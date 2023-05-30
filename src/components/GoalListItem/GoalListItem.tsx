import React, { MouseEventHandler, useMemo } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { gray4, textColor, gapS, gapXs, radiusM, gray9, gapSm } from '@taskany/colors';
import { MessageIcon, Text, Tag as TagItem, nullable } from '@taskany/bricks';
import type { Estimate, State, Tag } from '@prisma/client';

import { routes } from '../../hooks/router';
import { Priority } from '../../types/priority';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateDot } from '../StateDot';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { estimateToString } from '../../utils/estimateToString';
import { UserGroup } from '../UserGroup';

const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));

interface GoalListItemProps {
    id: string;
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    tags?: Array<Tag | undefined>;
    state?: State;
    createdAt: Date;
    updatedAt: Date;
    estimate?: Estimate;
    comments?: number;
    isNotViewed?: boolean;
    focused?: boolean;
    priority?: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: Tag) => MouseEventHandler<HTMLDivElement>;
}

export const GoalsListContainer = styled.div`
    display: table;
    width: 100%;
    margin: 0 -20px;
    padding: 0 20px;
`;

const GoalCell = styled.div<{ align?: 'center' | 'left' | 'right' }>`
    font-size: 0;
    display: table-cell;
    transition: background-color 150ms ease-in;
    text-align: ${({ align = 'left' }) => align};
    vertical-align: middle;

    &:last-child {
        width: 1%;
        white-space: nowrap;
        padding: ${gapXs} ${gapSm} ${gapXs} 0;
        border-radius: 0 ${radiusM} ${radiusM} 0;
    }

    &:first-child {
        padding: ${gapXs} 0 ${gapXs} ${gapSm};
        border-radius: ${radiusM} 0 0 ${radiusM};
    }
`;

const Goal = styled.a<{ focused?: boolean }>`
    display: table-row;
    align-items: center;

    color: ${textColor};
    text-decoration: none;

    &:hover {
        background-color: ${gray4};
    }

    &:visited {
        color: ${textColor};
    }

    ${({ focused }) =>
        focused &&
        `
            ${GoalCell} {
                background-color: ${gray4};
            }
        `}

    border-radius: ${radiusM};
`;

const GoalTitleItem = styled(GoalCell)`
    overflow: hidden;
    width: 30%;
    min-width: 410px;
    white-space: normal;
`;

const GoalContentItem = styled(GoalCell)`
    justify-self: center;
    align-self: center;
    padding: ${gapXs} ${gapS};
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

const GoalTag = styled(TagItem)`
    margin: calc(${gapXs} / 2) 0;
    margin-right: ${gapXs};

    & + & {
        margin-left: 0;
    }
    &:last-child {
        margin-right: 0;
    }
`;

const GoalStateDot = styled(StateDot)`
    margin: 0 auto;
`;

const CommentsCountContainer = styled.div`
    white-space: nowrap;
`;

const CommentsCount = styled(Text)`
    display: inline-block;
    margin-left: ${gapXs};
    vertical-align: middle;
`;

const CommentsCountIcon = styled(MessageIcon)`
    display: inline-block;
    vertical-align: middle;
`;

const GoalTextItem = styled(Text).attrs({
    size: 's',
    weight: 'bold',
    color: gray9,
})``;

const RelatedTextItem = styled(GoalTextItem).attrs({
    weight: 'regular',
})``;

export const GoalListItem: React.FC<GoalListItemProps> = React.memo(
    ({
        shortId,
        projectId,
        owner,
        issuer,
        participants,
        updatedAt,
        tags,
        title,
        comments,
        isNotViewed,
        state,
        focused,
        estimate,
        priority,
        onClick,
        className,
        onTagClick,
    }) => {
        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }, [issuer, owner]);

        return (
            <NextLink href={routes.goal(shortId)} passHref>
                <Goal focused={focused} onClick={onClick} className={className}>
                    <GoalTitleItem>
                        <GoalTitleContainer>
                            {isNotViewed && <NotViewedDot />}
                            <GoalTitle size="m" weight="bold">
                                {title}
                            </GoalTitle>
                        </GoalTitleContainer>
                    </GoalTitleItem>
                    <GoalContentItem>
                        {nullable(state, (s) => (
                            <GoalStateDot size="m" hue={s.hue} />
                        ))}
                    </GoalContentItem>
                    <GoalContentItem>
                        <GoalTextItem>{getPriorityText(priority as Priority)}</GoalTextItem>
                    </GoalContentItem>

                    <GoalContentItem>
                        <GoalTextItem>{projectId}</GoalTextItem>
                    </GoalContentItem>

                    <GoalContentItem align="center">
                        <UserGroup users={issuers} />
                    </GoalContentItem>

                    <GoalContentItem>
                        <GoalTextItem>{nullable(estimate, (e) => estimateToString(e))}</GoalTextItem>
                    </GoalContentItem>

                    <GoalContentItem>
                        {tags?.map((tag) =>
                            nullable(tag, (t) => (
                                <GoalTag
                                    key={t.id}
                                    title={t.title}
                                    description={t.description ?? undefined}
                                    onClick={onTagClick?.(t)}
                                />
                            )),
                        )}
                    </GoalContentItem>

                    <GoalContentItem>
                        {nullable(participants, (p) => (
                            <UserGroup users={p} />
                        ))}
                    </GoalContentItem>

                    <GoalContentItem>
                        {comments !== 0 && (
                            <CommentsCountContainer>
                                <CommentsCountIcon size="s" />
                                <CommentsCount size="xs" weight="bold">
                                    {comments}
                                </CommentsCount>
                            </CommentsCountContainer>
                        )}
                    </GoalContentItem>
                    <GoalContentItem>
                        <RelatedTextItem>
                            <RelativeTime date={updatedAt} />
                        </RelatedTextItem>
                    </GoalContentItem>
                </Goal>
            </NextLink>
        );
    },
);
