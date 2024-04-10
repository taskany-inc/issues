import React, { FC, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { UserPic, nullable, useCopyToClipboard, useLatest } from '@taskany/bricks';
import { IconBinOutline, IconClipboardOutline, IconEditOutline, IconMoreVerticalOutline } from '@taskany/icons';
import * as Sentry from '@sentry/nextjs';
import { Card, CardContent, CardInfo, Button, Link, Text } from '@taskany/bricks/harmony';
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
import { useClickSwitch } from '../../hooks/useClickSwitch';
import { CommentSchema } from '../../schema/comment';
import { Reactions } from '../Reactions/Reactions';
import { ActivityFeedItem } from '../ActivityFeed/ActivityFeed';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { Circle } from '../Circle/Circle';
import { CommentForm } from '../CommentForm/CommentForm';
import { getUserName } from '../../utils/getUserName';
import { CommentViewHeader } from '../CommentViewHeader/CommentViewHeader';
import { notifyPromise } from '../../utils/notifyPromise';
import { ReactionsMap } from '../../types/reactions';
import { profileUrl } from '../../utils/config';
import { State } from '../../../trpc/inferredTypes';
import { usePageContext } from '../../hooks/usePageContext';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

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
    state?: State;
    pin?: boolean;

    onReactionToggle?: React.ComponentProps<typeof ReactionsDropdown>['onClick'];
    onSubmit?: (comment?: CommentSchema) => void;
    onChange?: (comment: CommentSchema) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    className?: string;
}

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
    className,
}) => {
    const { theme } = usePageContext();

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
                id: 'Copy raw',
                label: tr('Copy raw'),
                icon: <IconClipboardOutline size="xxs" />,
                onClick: () => notifyPromise(copyValue(descriptionRef.current), 'copy'),
            },
        ];

        if (canEdit) {
            return [
                {
                    id: 'Edit',
                    label: tr('Edit'),
                    icon: <IconEditOutline size="xxs" {...commentDropdownEdit.attr} />,
                    onClick: () => {
                        setEditMode(true);
                        setFocused(true);
                    },
                },
                {
                    id: 'Delete',
                    label: tr('Delete'),
                    className: s.CommentActionsItem_danger,
                    icon: <IconBinOutline size="xxs" {...commentDropdownDelete.attr} />,
                    onClick: onDelete,
                },
            ].concat(items);
        }

        return items;
    }, [canEdit, copyValue, descriptionRef, onDelete]);

    const headerColors = useMemo(
        () => ({
            backgroundColor: state?.[`${theme}Background`] ?? undefined,
            foregroundColor: state?.[`${theme}Foreground`] ?? undefined,
        }),
        [state, theme],
    );

    return (
        <ActivityFeedItem className={cn(s.CommentView, className)} id={pin ? '' : `comment-${id}`} {...comment.attr}>
            <Circle size={32}>
                {pin ? (
                    <UserPic size={32} src={author?.image} email={author?.email} name={author?.name} />
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
                    <CardInfo onClick={onDateViewTypeChange} className={s.CardInfo} corner {...headerColors}>
                        {nullable(author, (data) => (
                            <CommentViewHeader
                                name={getUserName(data)}
                                timeAgo={
                                    <RelativeTime
                                        isRelativeTime={isRelative}
                                        date={createdAt}
                                        className={s.CommentTime}
                                    />
                                }
                                href={`#comment-${id}`}
                                state={state}
                            />
                        ))}
                        <div className={s.CommentActions}>
                            <Dropdown>
                                <DropdownTrigger
                                    renderTrigger={(props) => (
                                        <Button
                                            size="xs"
                                            view="ghost"
                                            className={s.DropdownTriggerButton}
                                            iconLeft={
                                                <IconMoreVerticalOutline
                                                    size="xs"
                                                    className={s.DropdownTrigger}
                                                    {...props}
                                                    {...commentDropdown.attr}
                                                />
                                            }
                                        />
                                    )}
                                />
                                <DropdownPanel
                                    placement="bottom-start"
                                    items={dropdownItems}
                                    mode="single"
                                    onChange={(props) => props.onClick?.()}
                                    renderItem={(props) => (
                                        <Text className={cn(s.CommentActionsItem, props.item.className)}>
                                            {props.item.icon}
                                            {props.item.label}
                                        </Text>
                                    )}
                                />
                            </Dropdown>
                        </div>
                    </CardInfo>

                    <CardContent className={s.CardComment}>
                        <Md className={s.Markdown} {...commentDescriptionDO.attr}>
                            {commentDescription.description}
                        </Md>
                        <Reactions reactions={reactions} onClick={onReactionToggle}>
                            {nullable(!reactionsProps.limited, () => (
                                <ReactionsDropdown view="button" onClick={onReactionToggle} />
                            ))}
                        </Reactions>
                    </CardContent>
                </Card>
            )}
        </ActivityFeedItem>
    );
};
