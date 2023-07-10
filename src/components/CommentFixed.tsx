import React, { FC, memo, useCallback, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { backgroundColor, gapM, gapS, gray4, gray9 } from '@taskany/colors';
import { Card, CardComment, CardInfo, Link, PinAltIcon, StateDot, Text, nullable } from '@taskany/bricks';
import { State, User } from '@prisma/client';
import colorLayer from 'color-layer';

import { createLocaleDate } from '../utils/dateTime';
import { usePageContext } from '../hooks/usePageContext';
import { useLocale } from '../hooks/useLocale';

import { ActivityFeedItem } from './ActivityFeed';
import { RelativeTime } from './RelativeTime/RelativeTime';
import { Circle, CircledIcon } from './Circle';

const Md = dynamic(() => import('./Md'));

const StyledCommentCard = styled(Card)`
    position: relative;
    min-height: 60px;

    transition: border-color 200ms ease-in-out;

    &::before {
        position: absolute;
        z-index: 0;

        content: '';

        width: 14px;
        height: 14px;

        background-color: ${gray4};

        border-left: 1px solid ${gray4};
        border-top: 1px solid ${gray4};
        border-radius: 2px;

        transform: rotate(-45deg);
        transition: border-color 200ms ease-in-out;

        top: 8px;
        left: -6px;
    }
`;

const StyledStateDot = styled(StateDot)`
    margin-right: ${gapS};
`;

const StyledTimestamp = styled.div`
    display: flex;
    align-items: center;

    padding-bottom: ${gapM};
`;

interface CommentFixedProps {
    id: string;
    author?: User | null;
    description: string;
    createdAt: Date;
    state?: State | null;
}

export const CommentFixed: FC<CommentFixedProps> = memo(({ id, author, description, createdAt, state }) => {
    const { themeId } = usePageContext();
    const locale = useLocale();
    const [isRelativeTime, setIsRelativeTime] = useState(true);

    const onChangeTypeDate = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined) => {
        if (e && e.target === e.currentTarget) {
            setIsRelativeTime((prev) => !prev);
        }
    }, []);

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <CircledIcon as={PinAltIcon} size="s" color={backgroundColor} />
            </Circle>

            <StyledCommentCard>
                <CardInfo onClick={onChangeTypeDate}>
                    <Link inline>{author?.name}</Link> —{' '}
                    <Link inline href={`#comment-${id}`}>
                        <RelativeTime isRelativeTime={isRelativeTime} date={createdAt} hover />
                    </Link>
                </CardInfo>

                <CardComment>
                    {nullable(state, (s) => (
                        <StyledTimestamp>
                            <StyledStateDot color={colorLayer(s.hue, 9, s.hue === 1 ? 0 : undefined)[themeId]} />
                            <Text size="m" weight="bolder" color={gray9}>
                                {createLocaleDate(createdAt, { locale })}
                            </Text>
                        </StyledTimestamp>
                    ))}
                    <Md>{description}</Md>
                </CardComment>
            </StyledCommentCard>
        </ActivityFeedItem>
    );
});
