import React, { FC, useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { Comment, User } from '../../graphql/@generated/genql';
import { brandColor, danger0, gapM, gapS, gray4 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';
import { useReactionsResource } from '../hooks/useReactionsResource';
import { useCommentResource } from '../hooks/useCommentResource';

import { Card, CardComment, CardInfo } from './Card';
import { Link } from './Link';
import { UserPic } from './UserPic';
import { Icon } from './Icon';
import { Reactions } from './Reactions';
import { ActivityFeedItem } from './ActivityFeed';
import { MenuItem } from './MenuItem';

const Md = dynamic(() => import('./Md'));
const Dropdown = dynamic(() => import('./Dropdown'));
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
    onDelete?: (id: string) => void;
}

const StyledCommentActions = styled.div`
    display: flex;
    align-items: center;
    justify-self: end;

    margin-right: -10px;

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
    onDelete,
    onReactionToggle,
}) => {
    const t = useTranslations('Comment.delete');
    const { remove } = useCommentResource({ t });
    const [editMode, setEditMode] = useState(false);
    const [commentDescription, setCommentDescription] = useState(description);
    const { reactionsProps } = useReactionsResource(reactions);

    const onEditClick = useCallback(() => {
        setEditMode(true);
    }, []);

    const onDoubleCommentClick = useCallback<React.MouseEventHandler>(
        (e) => {
            if (isEditable && e.detail === 2) {
                setTimeout(() => {
                    onEditClick();
                }, 100);
            }
        },
        [isEditable, onEditClick],
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

    // TODO: think twice about this
    const onDeleteClick = useCallback(() => {
        remove(({ id }) => {
            id && onDelete?.(id);
        })({ id });
    }, [id, onDelete, remove]);

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
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                            {nullable(isEditable, () => (
                                <span>
                                    <Dropdown
                                        items={[
                                            {
                                                label: 'Edit',
                                                icon: <Icon type="edit" size="xxs" />,
                                                onClick: onEditClick,
                                            },
                                            {
                                                label: 'Delete',
                                                color: danger0,
                                                icon: <Icon type="bin" size="xxs" />,
                                                onClick: onDeleteClick,
                                            },
                                        ]}
                                        renderTrigger={({ ref, onClick }) => (
                                            <Icon type="moreVertical" size="xs" ref={ref} onClick={onClick} />
                                        )}
                                        renderItem={({ item, cursor, index }) => (
                                            <MenuItem
                                                key={item.label}
                                                ghost
                                                color={item.color}
                                                focused={cursor === index}
                                                icon={item.icon}
                                                onClick={item.onClick}
                                            >
                                                {item.label}
                                            </MenuItem>
                                        )}
                                    />
                                </span>
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
