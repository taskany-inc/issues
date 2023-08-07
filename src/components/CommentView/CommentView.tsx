import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { brandColor, danger0, gapM, gapS, gray4, gray9, backgroundColor } from '@taskany/colors';
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
    PinAltIcon,
    Button,
} from '@taskany/bricks';
import { Reaction, State, User } from '@prisma/client';
import colorLayer from 'color-layer';

import { useReactionsResource } from '../../hooks/useReactionsResource';
import { usePageContext } from '../../hooks/usePageContext';
import { useLocale } from '../../hooks/useLocale';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { createLocaleDate } from '../../utils/dateTime';
import { CommentSchema } from '../../schema/comment';
import { Reactions } from '../Reactions';
import { ActivityFeedItem } from '../ActivityFeed';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { Circle, CircledIcon } from '../Circle';
import { CommentForm } from '../CommentForm/CommentForm';

import { tr } from './CommentView.i18n';

const Md = dynamic(() => import('../Md'));
const ReactionsDropdown = dynamic(() => import('../ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Date;
    updatedAt?: Date;
    reactions?: Reaction[];
    author?: User | null;
    highlight?: boolean;
    state?: State | null;
    pin?: boolean;

    onReactionToggle?: React.ComponentProps<typeof ReactionsDropdown>['onClick'];
    onSubmit?: (comment?: CommentSchema) => void;
    onChange?: (comment: CommentSchema) => void;
    onCancel?: () => void;
    onDelete?: () => void;
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

const StyledCommentCard = styled(Card)<Pick<CommentViewProps, 'highlight'>>`
    position: relative;
    min-height: 60px;

    transition: border-color 200ms ease-in-out;

    ${({ highlight }) =>
        highlight &&
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

        ${({ highlight }) =>
            highlight &&
            `
                border-color: ${brandColor};
            `}
    }
`;

const StyledCardInfo = styled(CardInfo)`
    display: flex;
    justify-content: space-between;
`;

const StyledCardComment = styled(CardComment)`
    display: flex;
    flex-direction: column;
    gap: ${gapM};
    word-break: break-all;
`;

const StyledTimestamp = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapS};
`;

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    highlight,
    reactions,
    state,
    pin,
    onChange,
    onCancel,
    onSubmit,
    onDelete,
    onReactionToggle,
}) => {
    const { themeId } = usePageContext();
    const locale = useLocale();
    const [editMode, setEditMode] = useState(false);
    const [focused, setFocused] = useState(false);
    const [busy, setBusy] = useState(false);
    const [commentDescription, setCommentDescription] = useState({ description });
    const { reactionsProps } = useReactionsResource(reactions);
    const [isRelative, onDateViewTypeChange] = useClickSwitch();

    const onCommentDoubleClick = useCallback<React.MouseEventHandler>((e) => {
        if (e.detail === 2) {
            setEditMode(true);
        }
    }, []);

    const onCommentSubmit = useCallback(
        async (form: CommentSchema) => {
            setBusy(true);
            setFocused(false);

            onChange?.({ description: form.description });

            // optimistic update
            setCommentDescription({ description: form.description });
            try {
                await onSubmit?.({ description: form.description });
            } catch (error) {
                setCommentDescription({ description });
            }

            setBusy(false);
        },
        [onSubmit, onChange, description],
    );

    const dropdownItems = useMemo(
        () => [
            {
                label: tr('Edit'),
                icon: <EditIcon size="xxs" />,
                onClick: () => setEditMode(true),
            },
            {
                label: tr('Delete'),
                color: danger0,
                icon: <BinIcon size="xxs" />,
                onClick: onDelete,
            },
        ],
        [onDelete],
    );

    return (
        <ActivityFeedItem id={pin ? '' : `comment-${id}`}>
            <Circle size={32}>
                {pin ? (
                    <CircledIcon as={PinAltIcon} size="s" color={backgroundColor} />
                ) : (
                    <UserPic size={32} src={author?.image} email={author?.email} />
                )}
            </Circle>

            {editMode ? (
                <CommentForm
                    description={description}
                    focused={focused}
                    busy={busy}
                    autoFocus
                    onChange={setCommentDescription}
                    onSubmit={onCommentSubmit}
                    onCancel={onCancel}
                    actionButton={
                        <Button
                            size="m"
                            view="primary"
                            disabled={commentDescription.description === description || busy}
                            outline
                            type="submit"
                            text={tr('Save')}
                        />
                    }
                />
            ) : (
                <StyledCommentCard highlight={highlight} onClick={onSubmit ? onCommentDoubleClick : undefined}>
                    <StyledCardInfo onClick={onDateViewTypeChange}>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#comment-${id}`}>
                                <RelativeTime isRelativeTime={isRelative} date={createdAt} hover />
                            </Link>
                        </div>
                        <StyledCommentActions>
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                            {nullable(onSubmit, () => (
                                <Dropdown
                                    items={dropdownItems}
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
                            ))}
                        </StyledCommentActions>
                    </StyledCardInfo>

                    <StyledCardComment>
                        {nullable(state, (s) => (
                            <StyledTimestamp>
                                <StateDot color={colorLayer(s.hue, 9, s.hue === 1 ? 0 : undefined)[themeId]} />
                                <Text size="m" weight="bolder" color={gray9}>
                                    {createLocaleDate(createdAt, { locale })}
                                </Text>
                            </StyledTimestamp>
                        ))}

                        <Md>{commentDescription.description}</Md>

                        {nullable(reactions?.length, () => (
                            <Reactions reactions={reactionsProps.reactions} onClick={onReactionToggle} />
                        ))}
                    </StyledCardComment>
                </StyledCommentCard>
            )}
        </ActivityFeedItem>
    );
};
