import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { State } from '@prisma/client';
import { Button, Dropdown, UserPic, nullable } from '@taskany/bricks';
import { IconDownSmallSolid, IconUpSmallSolid } from '@taskany/icons';

import { commentFormSubmitButton } from '../../utils/domObjects';
import { usePageContext } from '../../hooks/usePageContext';
import { GoalCommentFormSchema } from '../../schema/goal';
import { CommentSchema } from '../../schema/comment';
import { CommentForm } from '../CommentForm/CommentForm';
import { ActivityFeedItem } from '../ActivityFeed';
import { ColorizedMenuItem } from '../ColorizedMenuItem';
import { StateDot } from '../StateDot';
import { useLatest } from '../../hooks/useLatest';

import { tr } from './CommentCreateForm.i18n';

interface CommentCreateFormProps extends Omit<React.ComponentProps<typeof CommentForm>, 'actionButton'> {
    states?: State[];
    stateId?: string | null;

    onSubmit: (comment: GoalCommentFormSchema) => void;
    onChange?: (comment: GoalCommentFormSchema) => void;
}

const StyledStateUpdate = styled.div`
    display: flex;
    align-items: center;
`;

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

        return states.reduce<Record<string, State>>((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
        }, {});
    }, [states]);

    const { user, themeId } = usePageContext();

    const [pushState, setPushState] = useState(stateId ? statesMap[stateId] : undefined);
    const [description, setDescription] = useState(currentDescription);
    const descriptionRef = useLatest(description);
    const [focused, setFocused] = useState(Boolean(currentDescription));
    const [busy, setBusy] = useState(false);

    const onCommentFocus = useCallback(() => {
        setFocused(true);
        onFocus?.();
    }, [onFocus]);

    const onCommentChange = useCallback(
        ({ description }: { description: string }) => {
            setDescription(description);
            onChange?.({ description, stateId: pushState?.id });
        },
        [onChange, pushState?.id],
    );

    const onCommentSubmit = useCallback(
        async (form: CommentSchema & { stateId?: string }) => {
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
        setFocused(false);
        setPushState(stateId ? statesMap[stateId] : undefined);
        setDescription('');
        onCancel?.();
    }, [onCancel, stateId, statesMap]);

    const onStateSelect = useCallback(
        (state: State) => {
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
            <UserPic size={32} src={user?.image} email={user?.email} name={user?.name} />

            <CommentForm
                description={description}
                focused={focused}
                busy={busy}
                onChange={onCommentChange}
                onSubmit={onCommentFormSubmit('pushState')}
                onCancel={onCancelCreate}
                onFocus={onCommentFocus}
                actionButton={
                    <>
                        <Button
                            size="m"
                            view="primary"
                            disabled={busy}
                            outline
                            onClick={onCommentСlick}
                            text={tr('Comment')}
                        />
                        {nullable(states, () => (
                            <StyledStateUpdate>
                                <Button
                                    view="primary"
                                    disabled={busy}
                                    hue={pushState ? [pushState.hue, themeId] : undefined}
                                    outline
                                    type="submit"
                                    brick="right"
                                    text={tr('Update state')}
                                    iconLeft={pushState ? <StateDot hue={pushState.hue} /> : undefined}
                                    {...commentFormSubmitButton.attr}
                                />
                                <Dropdown
                                    placement="top-end"
                                    arrow
                                    items={states}
                                    offset={[-5, 20]}
                                    onChange={onStateSelect}
                                    renderTrigger={(props) => (
                                        <Button
                                            view="primary"
                                            hue={pushState ? [pushState.hue, themeId] : undefined}
                                            outline
                                            brick="left"
                                            iconRight={
                                                props.visible ? (
                                                    <IconUpSmallSolid size="s" />
                                                ) : (
                                                    <IconDownSmallSolid size="s" />
                                                )
                                            }
                                            ref={props.ref}
                                            onClick={props.onClick}
                                        />
                                    )}
                                    renderItem={(props) => (
                                        <ColorizedMenuItem
                                            key={props.item.id}
                                            hue={props.item.hue}
                                            checked={props.item.id === pushState?.id}
                                            onClick={props.onClick}
                                        >
                                            {props.item.title}
                                        </ColorizedMenuItem>
                                    )}
                                />
                            </StyledStateUpdate>
                        ))}
                    </>
                }
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
