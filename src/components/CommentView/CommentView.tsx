import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { brandColor, danger0, gapM, gapS, gray4, gray9 } from '@taskany/colors';
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
    StateDot,
    Text,
    UserPic,
    nullable,
} from '@taskany/bricks';
import { Reaction, State, User } from '@prisma/client';
import colorLayer from 'color-layer';

import { useReactionsResource } from '../../hooks/useReactionsResource';
import { useCommentResource } from '../../hooks/useCommentResource';
import { usePageContext } from '../../hooks/usePageContext';
import { createLocaleDate } from '../../utils/dateTime';
import { Reactions } from '../Reactions';
import { ActivityFeedItem } from '../ActivityFeed';
import { useLocale } from '../../hooks/useLocale';
import { RelativeTime } from '../RelativeTime/RelativeTime';

import { tr } from './CommentView.i18n';

const Md = dynamic(() => import('../Md'));
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
    state?: State | null;

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

const StyledStateDot = styled(StateDot)`
    margin-right: ${gapS};
`;

const StyledTimestamp = styled.div`
    display: flex;
    align-items: center;

    padding-bottom: ${gapM};
`;

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    isNew,
    isEditable,
    reactions,
    state,
    onDelete,
    onReactionToggle,
}) => {
    const { themeId } = usePageContext();
    const locale = useLocale();
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

    const onChange = useCallback<React.ComponentProps<typeof CommentEditForm>['onChange']>(({ description }) => {
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
                    onChange={onChange}
                    onUpdate={onUpdate}
                />
            ) : (
                <StyledCommentCard isNew={isNew} onClick={onDoubleCommentClick}>
                    <StyledCardInfo onClick={onChangeTypeDate}>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#comment-${id}`}>
                                <RelativeTime isRelativeTime={isRelativeTime} date={createdAt} hover />
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
                        {nullable(state, (s) => (
                            <StyledTimestamp>
                                <StyledStateDot color={colorLayer(s.hue, 9, s.hue === 1 ? 0 : undefined)[themeId]} />
                                <Text size="m" weight="bolder" color={gray9}>
                                    {createLocaleDate(createdAt, { locale })}
                                </Text>
                            </StyledTimestamp>
                        ))}

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
