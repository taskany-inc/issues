import React, { useState, useCallback, useMemo } from 'react';
import { State as StateDataType } from '@prisma/client';
import { nullable, useLatest } from '@taskany/bricks';
import { IconDownSmallSolid, IconUpSmallSolid } from '@taskany/icons';
import { Avatar, Button } from '@taskany/bricks/harmony';

import { commentFormSubmitButton } from '../../utils/domObjects';
import { usePageContext } from '../../hooks/usePageContext';
import { GoalCommentFormSchema } from '../../schema/goal';
import { CommentSchema } from '../../schema/comment';
import { CommentForm } from '../CommentForm/CommentForm';
import { StateDot } from '../StateDot/StateDot';
import { ActivityFeedItem } from '../ActivityFeed/ActivityFeed';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';
import { State } from '../State';
import { getStateProps } from '../GoalBadge';

import { tr } from './CommentCreateForm.i18n';
import s from './CommentCreateForm.module.css';

interface CommentCreateFormProps extends Omit<React.ComponentProps<typeof CommentForm>, 'actionButton'> {
    states?: StateDataType[];
    stateId?: string | null;

    onSubmit: (comment: GoalCommentFormSchema) => void;
    onChange?: (comment: GoalCommentFormSchema) => void;
}

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({
    states,
    description: currentDescription = '',
    stateId,
    onSubmit,
    onFocus,
    onCancel,
    onChange,
}) => {
    const statesMap = useMemo(() => {
        if (!states) return {};

        return states.reduce<Record<string, StateDataType>>((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
        }, {});
    }, [states]);

    const { user } = usePageContext();

    const [pushState, setPushState] = useState(stateId ? statesMap[stateId] : undefined);
    const [description, setDescription] = useState(currentDescription);
    const descriptionRef = useLatest(description);
    const [focused, setFocused] = useState(Boolean(currentDescription));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<{ message: string } | undefined>();

    const onCommentFocus = useCallback(() => {
        setFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentChange = useCallback(
        ({ description }: { description: string }) => {
            setDescription(description);
            setError(undefined);
            onChange?.({ description, stateId: pushState?.id });
        },
        [onChange, pushState?.id],
    );

    const onCommentSubmit = useCallback(
        async (form: CommentSchema & { stateId?: string }) => {
            if (!form.description.length) {
                setError({ message: tr("Comments's description is required") });
                return;
            }

            setBusy(true);
            setFocused(false);

            await onSubmit?.(form);

            setDescription('');
            setPushState(form.stateId ? statesMap[form.stateId] : undefined);

            setBusy(false);
            setFocused(true);
        },
        [onSubmit, statesMap],
    );

    const onCancelCreate = useCallback(() => {
        setBusy(false);
        setPushState(stateId ? statesMap[stateId] : undefined);
        setDescription('');
        onCancel?.();
    }, [onCancel, stateId, statesMap]);

    const onBlur = useCallback(() => {
        setFocused(false);
    }, []);

    const onStateSelect = useCallback(
        (state: StateDataType) => {
            setPushState((prev) => {
                const newState = state.id === prev?.id ? undefined : state;
                onChange?.({ description: descriptionRef.current, stateId: newState?.id });

                return newState;
            });
        },
        [onChange, descriptionRef],
    );

    const onCommentFormSubmit = useCallback(
        (type: 'pushState' | 'default') => {
            return (formData: CommentSchema) => {
                const data: CommentSchema & { stateId?: string } = { ...formData };

                if (type === 'pushState' && pushState) {
                    data.stateId = pushState?.id;
                }

                return onCommentSubmit(data);
            };
        },
        [onCommentSubmit, pushState],
    );

    const onCommentСlick = useCallback(() => {
        onCommentFormSubmit('default')({ description: descriptionRef.current });
    }, [descriptionRef, onCommentFormSubmit]);

    return (
        <ActivityFeedItem>
            <Avatar size="m" src={user?.image} email={user?.email} name={user?.name} />

            <CommentForm
                description={description}
                focused={focused}
                busy={busy}
                onChange={onCommentChange}
                onSubmit={onCommentFormSubmit('pushState')}
                onCancel={onCancelCreate}
                onBlur={onBlur}
                onFocus={onCommentFocus}
                passedError={error}
                actionButton={
                    <>
                        <Button view="primary" disabled={busy} onClick={onCommentСlick} text={tr('Comment')} />
                        {nullable(states, (list) => (
                            <div className={s.UpdateStateWrapper}>
                                <Button
                                    disabled={busy}
                                    type="submit"
                                    brick="right"
                                    text={tr('Update state')}
                                    iconLeft={
                                        pushState ? <StateDot state={getStateProps(pushState)} size="l" /> : undefined
                                    }
                                    {...commentFormSubmitButton.attr}
                                />
                                <Dropdown>
                                    <DropdownTrigger
                                        renderTrigger={(props) => (
                                            <Button
                                                brick="left"
                                                type="button"
                                                onClick={props.onClick}
                                                iconRight={
                                                    props.isOpen ? (
                                                        <IconUpSmallSolid size="s" />
                                                    ) : (
                                                        <IconDownSmallSolid size="s" />
                                                    )
                                                }
                                                ref={props.ref}
                                            />
                                        )}
                                    />
                                    <DropdownPanel
                                        placement="top-end"
                                        items={list}
                                        mode="single"
                                        onChange={onStateSelect}
                                        renderItem={(props) => <State state={props.item} />}
                                    />
                                </Dropdown>
                            </div>
                        ))}
                    </>
                }
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
