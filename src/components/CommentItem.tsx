import React, { FC } from 'react';
import styled, { css } from 'styled-components';

import { Scalars, UserAnyKind } from '../../graphql/@generated/genql';
import { backgroundColor, brandColor, gray4 } from '../design/@generated/themes';

import { Card, CardContent, CardInfo } from './Card';
import { Link } from './Link';
import { RelativeTime } from './RelativeTime';
import { Text } from './Text';
import { UserPic } from './UserPic';

interface CommentItemProps {
    author?: UserAnyKind;
    comment: string;
    createdAt: Scalars['DateTime'];
    isNew?: boolean;
}

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledCommentForm = styled<{ props }>(Card)`
    ${(props) =>
        props.isNew &&
        css`
            border-color: ${brandColor};
        `}
    position: relative;
    z-index: 2;
    overflow: visible;
    &::before {
        ${(props) =>
            props.isNew &&
            css`
                border-color: ${brandColor};
            `}
        position: absolute;
        content: '';
        width: 20px;
        height: 20px;
        background-color: ${backgroundColor};
        border-left: 1px solid ${gray4};
        border-top: 1px solid ${gray4};
        border-radius: 2px;
        z-index: 3;
        transform: rotate(-45deg);
        top: 14px;
        left: -11px;
    }
`;

const StyledCardInfo = styled(CardInfo)`
    position: relative;
    z-index: 4;
`;

const StyledUserPic = styled.div`
    padding-top: 11px;
`;

export const CommentItem: FC<CommentItemProps> = ({ author, comment, createdAt, isNew }) => {
    console.log(isNew);

    return (
        <StyledComment>
            <StyledUserPic>
                <UserPic size={32} src={author?.image} />
            </StyledUserPic>
            <StyledCommentForm isNew={isNew}>
                <StyledCardInfo>
                    <Link inline>{author?.name}</Link> — <RelativeTime date={createdAt} />
                </StyledCardInfo>

                <CardContent>
                    <Text>{comment}</Text>
                </CardContent>
            </StyledCommentForm>
        </StyledComment>
    );
};
