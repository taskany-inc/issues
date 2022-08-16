import React, { FC } from 'react';
import styled, { css } from 'styled-components';

import { Scalars, UserAnyKind } from '../../graphql/@generated/genql';
import { brandColor, gray4 } from '../design/@generated/themes';

import { Card, CardContent, CardInfo } from './Card';
import { Link } from './Link';
import { Md } from './Md';
import { RelativeTime } from './RelativeTime';
import { UserPic } from './UserPic';

interface CommentItemProps {
    comment: string;
    createdAt: Scalars['DateTime'];
    author?: UserAnyKind;
    isNew?: boolean;
}

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledCommentCard = styled(Card)<{ isNew?: boolean }>`
    position: relative;
    min-height: 90px;

    ${({ isNew }) =>
        isNew &&
        css`
            border-color: ${brandColor};
        `}

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

        top: 8px;
        left: -6px;

        ${({ isNew }) =>
            isNew &&
            css`
                border-color: ${brandColor};
            `}
    }
`;

export const CommentItem: FC<CommentItemProps> = ({ author, comment, createdAt, isNew }) => {
    return (
        <StyledComment>
            <UserPic size={32} src={author?.image} />

            <StyledCommentCard isNew={isNew}>
                <CardInfo>
                    <Link inline>{author?.name}</Link> — <RelativeTime date={createdAt} />
                </CardInfo>

                <CardContent>
                    <Md>{comment}</Md>
                </CardContent>
            </StyledCommentCard>
        </StyledComment>
    );
};
