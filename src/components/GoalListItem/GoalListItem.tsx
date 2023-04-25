import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { gray4, textColor, gray10, gapM, gapS } from '@taskany/colors';
import { GitForkIcon, MessageIcon, Text, Tag as TagItem, nullable, UserPic } from '@taskany/bricks';

import { routes } from '../../hooks/router';
import type { Scalars, State, Tag, Activity } from '../../../graphql/@generated/genql';
import { Priority, priorityColorsMap } from '../../types/priority';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateDot } from '../StateDot';

import { tr } from './GoalListItem.i18n';

const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));

interface GoalListItemProps {
    id: string;
    title: string;
    issuer?: Activity;
    tags?: Array<Tag | undefined>;
    state?: State;
    createdAt: Scalars['DateTime'];
    owner?: Activity;
    comments?: number;
    hasForks?: boolean;
    isNotViewed?: boolean;
    focused?: boolean;
    priority?: string;

    onClick?: MouseEventHandler<HTMLAnchorElement>;
    onTagClick?: (tag: Tag) => MouseEventHandler<HTMLDivElement>;
}

const StyledGoal = styled.a<{ focused?: boolean }>`
    display: grid;
    grid-template-columns: 15px 30px 600px repeat(4, 40px);
    align-items: center;

    color: ${textColor};
    text-decoration: none;

    transition: background-color 150ms ease-in;

    &:hover {
        background-color: ${gray4};
    }

    &:visited {
        color: ${textColor};
    }

    ${({ focused }) =>
        focused &&
        `
            background-color: ${gray4};
        `}

    padding: ${gapM} 20px;
    margin: 0 -20px;
`;

const StyledState = styled.div`
    align-self: start;
    justify-self: center;

    padding-top: 5px;
`;

const StyledNotViewed = styled.div`
    align-self: start;
    justify-self: center;
`;

const StyledNotViewedDot = styled.div`
    width: 5px;
    height: 5px;

    background-color: ${textColor};

    border-radius: 100%;
`;

const StyledName = styled.div`
    width: 800px;
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
`;

const StyledTitle = styled(Text)`
    margin-right: ${gapS};
`;

const StyledAddon = styled.div`
    justify-self: center;
    align-self: center;
    vertical-align: middle;
`;

const StyledCommentsCount = styled(Text)`
    display: inline-block;
    margin-left: ${gapS};
    vertical-align: top;
`;

const StyledSubTitle = styled(Text)`
    color: ${gray10};
    width: 100%;
    padding-top: ${gapS};
`;

const StyledTags = styled.div`
    padding-top: 1px;
`;

const StyledTag = styled(TagItem)`
    margin-right: ${gapS};
`;

const StyledMessageIcon = styled(MessageIcon)`
    vertical-align: middle;
`;

export const GoalListItem: React.FC<GoalListItemProps> = React.memo(
    ({
        id,
        owner,
        issuer,
        createdAt,
        tags,
        title,
        comments,
        hasForks,
        isNotViewed,
        state,
        focused,
        priority,
        onClick,
        onTagClick,
    }) => (
        <NextLink href={routes.goal(id)} passHref>
            <StyledGoal focused={focused} onClick={onClick}>
                <StyledNotViewed>{isNotViewed && <StyledNotViewedDot />}</StyledNotViewed>
                <StyledState>
                    {nullable(state, (s) => (
                        <StateDot size="m" hue={s.hue} />
                    ))}
                </StyledState>

                <StyledName>
                    <StyledTitle size="m" weight="bold">
                        {' '}
                        {title}
                    </StyledTitle>

                    <StyledTags>
                        {tags?.map((tag) =>
                            nullable(tag, (t) => (
                                <StyledTag
                                    key={t.id}
                                    title={t.title}
                                    description={t.description}
                                    onClick={onTagClick?.(t)}
                                />
                            )),
                        )}
                    </StyledTags>

                    <StyledSubTitle size="s">
                        #{id} <RelativeTime date={createdAt} kind="created" />
                        {` ${tr('by')} ${issuer?.user?.name}`}
                    </StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    {nullable(priority, (p) => (
                        <StateDot
                            size="s"
                            hue={priorityColorsMap[p as Priority]}
                            title={getPriorityText(p as Priority)}
                        />
                    ))}
                </StyledAddon>

                <StyledAddon>
                    <UserPic src={owner?.user?.image} email={owner?.user?.email || owner?.ghost?.email} size={24} />
                </StyledAddon>

                <StyledAddon>{hasForks && <GitForkIcon size="s" />}</StyledAddon>

                <StyledAddon>
                    {comments !== 0 && (
                        <>
                            <StyledMessageIcon size="s" />
                            <StyledCommentsCount size="xs" weight="bold">
                                {comments}
                            </StyledCommentsCount>
                        </>
                    )}
                </StyledAddon>
            </StyledGoal>
        </NextLink>
    ),
);
