import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownSmallIcon, ArrowUpSmallIcon, Button, Dropdown, UserPic } from '@taskany/bricks';
import { State } from '@prisma/client';
import styled from 'styled-components';

import { usePageContext } from '../../hooks/usePageContext';
import { useCommentResource } from '../../hooks/useCommentResource';
import { GoalCommentCreate, goalCreateCommentSchema } from '../../schema/goal';
import { CommentForm } from '../CommentForm/CommentForm';
import { ActivityFeedItem } from '../ActivityFeed';
import { ColorizedMenuItem } from '../ColorizedMenuItem';
import { StateDot } from '../StateDot';

import { tr } from './CommentCreateForm.i18n';

interface CommentCreateFormProps {
    goalId: string;
    states?: State[];

    onSubmit?: (id?: string) => void;
    onFocus?: () => void;
    onCancel?: () => void;
}

const StyledStateUpdate = styled.div`
    display: flex;
    align-items: center;
`;

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({ goalId, states, onSubmit, onFocus, onCancel }) => {
    const { user, themeId } = usePageContext();
    const { create } = useCommentResource();
    const [busy, setBusy] = useState(false);
    const [pushState, setPushState] = useState<State | undefined>();

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid },
    } = useForm<GoalCommentCreate>({
        resolver: zodResolver(goalCreateCommentSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            id: goalId,
            description: '',
        },
    });

    const createComment = useCallback(
        (form: GoalCommentCreate) => {
            setBusy(true);

            // FIXME: maybe async/await would be better API
            create(({ id }) => {
                onSubmit?.(id);
                reset();
                setPushState(undefined);
                setBusy(false);
            })({
                ...form,
                id: goalId,
                stateId: pushState?.id,
            });
        },
        [create, goalId, pushState, onSubmit, reset],
    );

    const onCancelCreate = useCallback(() => {
        reset();
        setPushState(undefined);
        onCancel?.();
    }, [onCancel, reset]);

    const onStateSelect = useCallback(
        (state: State) => {
            setPushState(state.id === pushState?.id ? undefined : state);
        },
        [pushState],
    );

    return (
        <ActivityFeedItem>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <CommentForm
                busy={busy}
                control={control}
                isValid={isValid}
                onSubmit={handleSubmit(createComment)}
                onCancel={onCancelCreate}
                onFocus={onFocus}
                actionButton={
                    states ? (
                        <StyledStateUpdate>
                            <Button
                                view="primary"
                                hue={pushState ? [pushState.hue, themeId] : undefined}
                                outline
                                type="submit"
                                brick="right"
                                text={pushState ? tr('Update state') : tr('Comment')}
                                iconLeft={pushState ? <StateDot hue={pushState.hue} /> : undefined}
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
                                                <ArrowUpSmallIcon size="s" noWrap />
                                            ) : (
                                                <ArrowDownSmallIcon size="s" noWrap />
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
                    ) : (
                        <Button size="m" view="primary" disabled={busy} outline type="submit" text={tr('Comment')} />
                    )
                }
            />
        </ActivityFeedItem>
    );
};

export default CommentCreateForm;
