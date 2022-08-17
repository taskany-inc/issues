import React, { FC } from 'react';
import styled, { css } from 'styled-components';

import { Scalars, User } from '../../graphql/@generated/genql';
import { brandColor, gray4 } from '../design/@generated/themes';

import { Card, CardContent, CardInfo } from './Card';
import { Link } from './Link';
import { Md } from './Md';
import { RelativeTime } from './RelativeTime';
import { UserPic } from './UserPic';

interface CommentItemProps {
    description: string;
    createdAt: Scalars['DateTime'];
    updatedAt?: Scalars['DateTime']; // https://github.com/taskany-inc/issues/issues/217
    author?: User;
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

export const Comment: FC<CommentItemProps> = ({ author, description, createdAt, isNew }) => {
    return (
        <StyledComment>
            <UserPic size={32} src={author?.image} />

            <StyledCommentCard isNew={isNew}>
                <CardInfo>
                    {/* https://github.com/taskany-inc/issues/issues/218 */}
                    <Link inline>{author?.name}</Link> — <RelativeTime date={createdAt} />
                </CardInfo>

                <CardContent>
                    <Md>{description}</Md>
                </CardContent>
            </StyledCommentCard>
        </StyledComment>
    );
};
