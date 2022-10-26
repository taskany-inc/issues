import React, { FC, useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';

import { Scalars, User } from '../../graphql/@generated/genql';
import { brandColor, gray4, textColorPrimary } from '../design/@generated/themes';
import { TLocale } from '../types/locale';
import { nullable } from '../utils/nullable';

import { Card, CardComment, CardInfo } from './Card';
import { Link } from './Link';
import { UserPic } from './UserPic';
import { Icon } from './Icon';

const Md = dynamic(() => import('./Md'));
const RelativeTime = dynamic(() => import('./RelativeTime'));
const CommentEditForm = dynamic(() => import('./CommentEditForm'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Scalars['DateTime'];
    goalId: string;
    locale: TLocale;
    updatedAt?: Scalars['DateTime'];
    author?: User;
    isNew?: boolean;
    isEditable?: boolean;
}

export const commentMask = 'comment-';

const StyledCommentActions = styled.div`
    display: flex;
    align-items: center;
    justify-self: end;

    opacity: 0;

    transition: opacity, color 150ms ease-in-out;
`;

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledCommentCard = styled(Card)<{ isNew?: boolean }>`
    position: relative;
    min-height: 60px;

    user-select: none;

    transition: border-color 200ms ease-in-out;

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
        transition: border-color 200ms ease-in-out;

        top: 8px;
        left: -6px;

        ${({ isNew }) =>
            isNew &&
            css`
                border-color: ${brandColor};
            `}
    }

    &:hover {
        ${StyledCommentActions} {
            opacity: 1;

            &:hover {
                color: ${textColorPrimary};
            }
        }
    }
`;

const StyledCardInfo = styled(CardInfo)`
    display: grid;
    grid-template-columns: 6fr 6fr;
`;

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    isNew,
    isEditable,
    goalId,
    locale,
}) => {
    const [editMode, setEditMode] = useState(false);

    const onDoubleCommentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail === 2) {
            setTimeout(() => {
                setEditMode(true);
            }, 100);
        }
    }, []);

    const onCommentBlur = useCallback(() => {
        setEditMode(false);
    }, []);

    return (
        <StyledComment id={`${commentMask}${id}`}>
            <UserPic size={32} src={author?.image} email={author?.email} />

            {editMode ? (
                <CommentEditForm
                    goalId={goalId}
                    locale={locale}
                    value={description}
                    onBlur={onCommentBlur}
                    onCancel={() => setEditMode(false)}
                />
            ) : (
                <StyledCommentCard isNew={isNew} onClick={onDoubleCommentClick}>
                    <StyledCardInfo>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#${commentMask}${id}`}>
                                <RelativeTime date={createdAt} />
                            </Link>
                        </div>
                        {nullable(isEditable, () => (
                            <StyledCommentActions>
                                <Icon type="editCircle" size="xs" noWrap onClick={() => setEditMode(true)} />
                            </StyledCommentActions>
                        ))}
                    </StyledCardInfo>

                    <CardComment>
                        <Md>{description}</Md>
                    </CardComment>
                </StyledCommentCard>
            )}
        </StyledComment>
    );
};
