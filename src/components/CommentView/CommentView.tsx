import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { brandColor, danger0, gapM, gapS, gray4 } from '@taskany/colors';
import {
    BinIcon,
    Card,
    CardComment,
    CardInfo,
    Dropdown,
    EditIcon,
    Link,
    MenuItem,
    MoreVerticalIcon,
    UserPic,
    nullable,
} from '@taskany/bricks';
import { Reaction, User } from '@prisma/client';

import { useReactionsResource } from '../../hooks/useReactionsResource';
import { useCommentResource } from '../../hooks/useCommentResource';
import { Reactions } from '../Reactions';
import { ActivityFeedItem } from '../ActivityFeed';

import { tr } from './CommentView.i18n';

const Md = dynamic(() => import('../Md'));
const RelativeTime = dynamic(() => import('../RelativeTime/RelativeTime'));
const CommentEditForm = dynamic(() => import('../CommentEditForm/CommentEditForm'));
const ReactionsDropdown = dynamic(() => import('../ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Date;
    updatedAt?: Date;
    reactions?: Reaction[];
    author?: User | null;
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

    transition: border-color 200ms ease-in-out;

    ${({ isNew }) =>
        isNew &&
        `
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
            `
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
    const { remove } = useCommentResource();
    const [editMode, setEditMode] = useState(false);
    const [commentDescription, setCommentDescription] = useState(description);
    const { reactionsProps } = useReactionsResource(reactions);
    const [isRelativeTime, setIsRelativeTime] = useState(true);

    const onChangeTypeDate = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined) => {
        if (e && e.target === e.currentTarget) {
            setIsRelativeTime(!isRelativeTime);
        }
    };

    const onEditClick = useCallback(() => {
        setEditMode(true);
    }, []);

    const onDoubleCommentClick = useCallback<React.MouseEventHandler>(
        (e) => {
            if (isEditable && e.detail === 2) {
                onEditClick();
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

    // FIXME: think twice about this
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
                    <StyledCardInfo onClick={onChangeTypeDate}>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#comment-${id}`}>
                                <RelativeTime isRelativeTime={isRelativeTime} date={createdAt} />
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
                                                label: tr('Edit'),
                                                icon: <EditIcon size="xxs" />,
                                                onClick: onEditClick,
                                            },
                                            {
                                                label: tr('Delete'),
                                                color: danger0,
                                                icon: <BinIcon size="xxs" />,
                                                onClick: onDeleteClick,
                                            },
                                        ]}
                                        renderTrigger={({ ref, onClick }) => (
                                            <MoreVerticalIcon size="xs" ref={ref} onClick={onClick} />
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
