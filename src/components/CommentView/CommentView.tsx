import React, { FC, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { danger0 } from '@taskany/colors';
import {
    Card,
    CardComment,
    CardInfo,
    Dropdown,
    MenuItem,
    UserPic,
    nullable,
    useCopyToClipboard,
    useLatest,
} from '@taskany/bricks';
import { IconBinOutline, IconClipboardOutline, IconEditOutline, IconMoreVerticalOutline } from '@taskany/icons';
import * as Sentry from '@sentry/nextjs';
import { Button, Text, Link } from '@taskany/bricks/harmony';
import cn from 'classnames';

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
import { StateDot } from '../StateDot/StateDot';
import { getUserName } from '../../utils/getUserName';
import { CardHeader } from '../CardHeader/CardHeader';
import { notifyPromise } from '../../utils/notifyPromise';
import { ReactionsMap } from '../../types/reactions';
import { profileUrl } from '../../utils/config';

import { tr } from './CommentView.i18n';
import s from './CommentView.module.css';

const Md = dynamic(() => import('../Md'));
const ReactionsDropdown = dynamic(() => import('../ReactionsDropdown/ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Date;
    updatedAt?: Date;
    reactions: ReactionsMap;
    author?: {
        name: string;
        email: string;
        image?: string;
    };
    highlight?: boolean;
    hue?: number;
    pin?: boolean;

    onReactionToggle?: React.ComponentProps<typeof ReactionsDropdown>['onClick'];
    onSubmit?: (comment?: CommentSchema) => void;
    onChange?: (comment: CommentSchema) => void;
    onCancel?: () => void;
    onDelete?: () => void;
}

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    highlight,
    reactions,
    hue,
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

    const onError = useCallback((err: Error) => {
        Sentry.captureException(err);
    }, []);

    const [, copyValue] = useCopyToClipboard(onError);

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
                        <StateDot hue={hue} className={s.StateDot} />
                    </>
                ) : (
                    nullable(
                        profileUrl && author,
                        ({ email, image, name }) => (
                            <Link href={`${profileUrl}/${encodeURIComponent(email)}`} view="secondary">
                                <UserPic size={32} src={image} email={email} name={name} />
                            </Link>
                        ),
                        <UserPic size={32} src={author?.image} email={author?.email} name={author?.name} />,
                    )
                )}
            </Circle>

            {editMode ? (
                <CommentForm
                    description={commentDescription.description}
                    focused={focused}
                    busy={busy}
                    autoFocus
                    onChange={setCommentDescription}
                    onSubmit={onCommentSubmit}
                    onCancel={onCommentCancel}
                    actionButton={
                        <Button
                            view="primary"
                            disabled={commentDescription.description === description || busy}
                            type="submit"
                            text={tr('Save')}
                            {...commentFormSubmitButton.attr}
                        />
                    }
                />
            ) : (
                <Card
                    className={cn(s.CommentCard, { [s.CommentCard_highlighted]: highlight })}
                    onClick={canEdit ? onCommentDoubleClick : undefined}
                >
                    <CardInfo onClick={onDateViewTypeChange} className={s.CardInfo}>
                        {nullable(author, (data) => (
                            <CardHeader
                                name={getUserName(data)}
                                timeAgo={<RelativeTime isRelativeTime={isRelative} date={createdAt} />}
                                href={`#comment-${id}`}
                            />
                        ))}
                        <div className={s.CommentActions}>
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                            <Dropdown
                                items={dropdownItems}
                                renderTrigger={({ ref, onClick }) => (
                                    <IconMoreVerticalOutline
                                        size="xs"
                                        className={s.DropdownTrigger}
                                        ref={ref}
                                        onClick={onClick}
                                        {...commentDropdown.attr}
                                    />
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
                        </div>
                    </CardInfo>

                    <CardComment className={s.CardComment}>
                        {nullable(hue, (h) => (
                            <div className={s.CommentTimestamp}>
                                {nullable(!pin, () => (
                                    <StateDot hue={h} />
                                ))}
                                <Text weight="bolder">{createLocaleDate(createdAt, { locale })}</Text>
                            </div>
                        ))}

                        <Md className={s.Markdown} {...commentDescriptionDO.attr}>
                            {commentDescription.description}
                        </Md>

                        {nullable(Object.keys(reactions), () => (
                            <Reactions reactions={reactions} onClick={onReactionToggle} />
                        ))}
                    </CardComment>
                </Card>
            )}
        </ActivityFeedItem>
    );
};
