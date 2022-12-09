import React, { FC, useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';

import { Comment, User } from '../../graphql/@generated/genql';
import { brandColor, gapM, gapS, gray4, textColorPrimary } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';
import { useReactionsProps } from '../hooks/useReactionsProps';

import { Card, CardComment, CardInfo } from './Card';
import { Link } from './Link';
import { UserPic } from './UserPic';
import { Icon } from './Icon';
import { Reactions } from './Reactions';
import { ActivityFeedItem } from './ActivityFeed';

const Md = dynamic(() => import('./Md'));
const RelativeTime = dynamic(() => import('./RelativeTime'));
const CommentEditForm = dynamic(() => import('./CommentEditForm'));
const ReactionsDropdown = dynamic(() => import('./ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: string;
    updatedAt?: string;
    reactions?: Comment['reactions'];
    author?: User;
    isNew?: boolean;
    isEditable?: boolean;

    onReactionToggle?: React.ComponentProps<typeof ReactionsDropdown>['onClick'];
}

const StyledCommentActions = styled.div`
    display: flex;
    align-items: center;
    justify-self: end;

    & > span {
        display: flex;
        align-self: center;
        transition: color 150ms ease-in-out;

        &:hover {
            color: ${textColorPrimary};
        }
    }

    & > span + span {
        margin-left: ${gapS};
    }
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
`;

const StyledCardInfo = styled(CardInfo)`
    display: grid;
    grid-template-columns: 6fr 6fr;
`;

const StyledReactions = styled.div`
    padding-top: ${gapM};
`;

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    isNew,
    isEditable,
    reactions,
    onReactionToggle,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [commentDescription, setCommentDescription] = useState(description);
    const reactionsProps = useReactionsProps(reactions);

    const onDoubleCommentClick = useCallback<React.MouseEventHandler>(
        (e) => {
            if (isEditable && e.detail === 2) {
                setTimeout(() => {
                    setEditMode(true);
                }, 100);
            }
        },
        [isEditable],
    );

    const onUpdate = useCallback<React.ComponentProps<typeof CommentEditForm>['onUpdate']>(
        (comment) => {
            setEditMode(false);
            setCommentDescription(comment?.description || commentDescription);
        },
        [commentDescription],
    );

    const onChanged = useCallback<React.ComponentProps<typeof CommentEditForm>['onChanged']>(({ description }) => {
        setCommentDescription(description);
    }, []);

    return (
        <ActivityFeedItem id={`comment-${id}`}>
            <UserPic size={32} src={author?.image} email={author?.email} />

            {editMode ? (
                <CommentEditForm
                    id={id}
                    description={commentDescription}
                    onCancel={onUpdate}
                    onChanged={onChanged}
                    onUpdate={onUpdate}
                />
            ) : (
                <StyledCommentCard isNew={isNew} onClick={onDoubleCommentClick}>
                    <StyledCardInfo>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#comment-${id}`}>
                                <RelativeTime date={createdAt} />
                            </Link>
                        </div>
                        <StyledCommentActions>
                            {nullable(isEditable, () => (
                                <span>
                                    <Icon type="editCircle" size="xs" noWrap onClick={() => setEditMode(true)} />
                                </span>
                            ))}
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                        </StyledCommentActions>
                    </StyledCardInfo>

                    <CardComment>
                        <Md>{commentDescription}</Md>

                        {nullable(reactions?.length, () => (
                            <StyledReactions>
                                <Reactions reactions={reactionsProps.reactions} onClick={onReactionToggle} />
                            </StyledReactions>
                        ))}
                    </CardComment>
                </StyledCommentCard>
            )}
        </ActivityFeedItem>
    );
};
