import React, { FC, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { State, User } from '@prisma/client';
import styled from 'styled-components';
import { backgroundColor, brandColor, danger0, gapM, gapS, gray4, gray9, textColor } from '@taskany/colors';
import {
    Card,
    CardComment,
    CardInfo,
    Dropdown,
    MenuItem,
    Text,
    UserPic,
    nullable,
    Button,
    Link,
} from '@taskany/bricks';
import { IconBinOutline, IconClipboardOutline, IconEditOutline, IconMoreVerticalOutline } from '@taskany/icons';

import { useReactionsResource } from '../../hooks/useReactionsResource';
import {
    comment,
    commentDescription as commentDescriptionDO,
    commentDropdown,
    commentDropdownDelete,
    commentDropdownEdit,
    commentFormSubmitButton,
} from '../../utils/domObjects';
import { useLocale } from '../../hooks/useLocale';
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { createLocaleDate } from '../../utils/dateTime';
import { CommentSchema } from '../../schema/comment';
import { Reactions } from '../Reactions/Reactions';
import { ActivityFeedItem } from '../ActivityFeed';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { Circle } from '../Circle';
import { CommentForm } from '../CommentForm/CommentForm';
import { StateDot } from '../StateDot';
import { getUserName } from '../../utils/getUserName';
import { CardHeader } from '../CardHeader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useLatest } from '../../hooks/useLatest';
import { notifyPromise } from '../../utils/notifyPromise';
import { Light } from '../Light';
import { ReactionsMap } from '../../types/reactions';
import { NextLink } from '../NextLink';
import { profileUrl } from '../../utils/config';

import { tr } from './CommentView.i18n';

const Md = dynamic(() => import('../Md'));
const ReactionsDropdown = dynamic(() => import('../ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Date;
    updatedAt?: Date;
    reactions: ReactionsMap;
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
    word-break: keep-all;
`;

const StyledTimestamp = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapS};
`;

const StyledMd = styled(Md)`
    overflow-x: auto;
`;

const StyledStateDot = styled(StateDot)`
    position: absolute;
    bottom: -50%;
    right: -50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    border: 4px solid ${backgroundColor};
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
    const locale = useLocale();
    const [editMode, setEditMode] = useState(false);
    const [focused, setFocused] = useState(false);
    const [busy, setBusy] = useState(false);
    const [commentDescription, setCommentDescription] = useState({ description });
    const { reactionsProps } = useReactionsResource(reactions);
    const [isRelative, onDateViewTypeChange] = useClickSwitch();
    const [, copyValue] = useCopyToClipboard();
    const descriptionRef = useLatest(commentDescription.description);

    const canEdit = Boolean(onSubmit);

    const onCommentDoubleClick = useCallback<React.MouseEventHandler>((e) => {
        if (e.detail === 2) {
            setEditMode(true);
            setFocused(true);
        }
    }, []);

    const onCommentSubmit = useCallback(
        async (form: CommentSchema) => {
            setEditMode(false);
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

    const onCommentCancel = useCallback(() => {
        setEditMode(false);
        setFocused(false);
        setCommentDescription({ description });
        onCancel?.();
    }, [description, onCancel]);

    const dropdownItems = useMemo(() => {
        const items = [
            {
                label: tr('Copy raw'),
                icon: <IconClipboardOutline size="xxs" />,
                onClick: () => notifyPromise(copyValue(descriptionRef.current), 'copy'),
            },
        ];

        if (canEdit) {
            return [
                {
                    label: tr('Edit'),
                    icon: <IconEditOutline size="xxs" {...commentDropdownEdit.attr} />,
                    onClick: () => {
                        setEditMode(true);
                        setFocused(true);
                    },
                },
                {
                    label: tr('Delete'),
                    color: danger0,
                    icon: <IconBinOutline size="xxs" {...commentDropdownDelete.attr} />,
                    onClick: onDelete,
                },
            ].concat(items);
        }

        return items;
    }, [canEdit, copyValue, descriptionRef, onDelete]);

    return (
        <ActivityFeedItem id={pin ? '' : `comment-${id}`} {...comment.attr}>
            <Circle size={32}>
                {pin ? (
                    <>
                        <UserPic size={32} src={author?.image} email={author?.email} name={author?.name} />
                        <StyledStateDot hue={state?.hue} />
                    </>
                ) : (
                    nullable(
                        profileUrl && author,
                        ({ email, image, name }) => (
                            <Link as={NextLink} href={`${profileUrl}/${encodeURIComponent(email)}`} inline>
                                <UserPic size={32} src={image} email={email} name={name} />
                            </Link>
                        ),
                        <UserPic size={32} src={author?.image} email={author?.email} name={author?.name} />,
                    )
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
                    onCancel={onCommentCancel}
                    actionButton={
                        <Button
                            size="m"
                            view="primary"
                            disabled={commentDescription.description === description || busy}
                            outline
                            type="submit"
                            text={tr('Save')}
                            {...commentFormSubmitButton.attr}
                        />
                    }
                />
            ) : (
                <StyledCommentCard highlight={highlight} onClick={canEdit ? onCommentDoubleClick : undefined}>
                    <StyledCardInfo onClick={onDateViewTypeChange}>
                        {nullable(author, (data) => (
                            <CardHeader
                                name={getUserName(data)}
                                timeAgo={<RelativeTime isRelativeTime={isRelative} date={createdAt} />}
                                href={`#comment-${id}`}
                            />
                        ))}
                        <StyledCommentActions>
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                            <Dropdown
                                items={dropdownItems}
                                renderTrigger={({ ref, onClick }) => (
                                    <Light color={textColor} ref={ref} onClick={onClick} {...commentDropdown.attr}>
                                        <IconMoreVerticalOutline size="xs" />
                                    </Light>
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
                        </StyledCommentActions>
                    </StyledCardInfo>

                    <StyledCardComment>
                        {nullable(state, (s) => (
                            <StyledTimestamp>
                                {nullable(!pin, () => (
                                    <StateDot hue={s.hue} />
                                ))}
                                <Text size="m" weight="bolder" color={gray9}>
                                    {createLocaleDate(createdAt, { locale })}
                                </Text>
                            </StyledTimestamp>
                        ))}

                        <StyledMd {...commentDescriptionDO.attr}>{commentDescription.description}</StyledMd>

                        {nullable(Object.keys(reactions), () => (
                            <Reactions reactions={reactions} onClick={onReactionToggle} />
                        ))}
                    </StyledCardComment>
                </StyledCommentCard>
            )}
        </ActivityFeedItem>
    );
};
