import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowDownSmallIcon, ArrowUpSmallIcon, Button, Dropdown, UserPic } from '@taskany/bricks';
import { State } from '@prisma/client';
import styled from 'styled-components';

import { usePageContext } from '../../hooks/usePageContext';
import { useCommentResource } from '../../hooks/useCommentResource';
import { GoalCommentSchema } from '../../schema/goal';
import { CommentForm } from '../CommentForm/CommentForm';
import { ActivityFeedItem } from '../ActivityFeed';
import { ColorizedMenuItem } from '../ColorizedMenuItem';
import { StateDot } from '../StateDot';

import { tr } from './CommentCreateForm.i18n';

interface CommentCreateFormProps {
    goalId: string;
    states?: State[];
    description?: string;
    stateId?: string;

    onSubmit?: (id?: string) => void;
    onFocus?: () => void;
    onCancel?: () => void;
    onChange?: (comment?: { description?: string; stateId?: string }) => void;
}

const StyledStateUpdate = styled.div`
    display: flex;
    align-items: center;
`;

const CommentCreateForm: React.FC<CommentCreateFormProps> = ({
    goalId,
    states,
    description: currentDescription,
    stateId = '',
    onSubmit,
    onFocus,
    onCancel,
    onChange,
}) => {
    const statesMap = useMemo(() => {
        if (!states) return {};

        return states.reduce((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
        }, {} as Record<string, State>);
    }, [states]);

    const { user, themeId } = usePageContext();
    const { create } = useCommentResource();
    const [pushState, setPushState] = useState<State | undefined>(statesMap[stateId]);
    const [description, setDescription] = useState<string | undefined>(currentDescription);
    const [focused, setFocused] = useState(Boolean(currentDescription));
    const [busy, setBusy] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(goalId);
    const [prevGoal, setPrevGoal] = useState('');

    useEffect(() => {
        if (!description) {
            onChange?.();
            return;
        }

        onChange?.({ description, stateId: pushState?.id });
    }, [pushState?.id, description, onChange]);

    useEffect(() => {
        if (goalId === prevGoal) return;

        setCurrentGoal(goalId);
        setPrevGoal(goalId);
        setDescription(currentDescription);
        setFocused(Boolean(currentDescription));
        setPushState(statesMap[stateId]);
    }, [currentDescription, goalId, prevGoal, stateId, statesMap]);

    const onCommentFocus = useCallback(() => {
        setFocused(true);
        onFocus?.();
    }, [onFocus]);

    const createComment = useCallback(
        async (form: GoalCommentSchema) => {
            setBusy(true);
            setFocused(false);

            await create(({ id }) => {
                onSubmit?.(id);
                setDescription('');
                setPushState(undefined);
            })(form);

            setBusy(false);
            setFocused(true);
        },
        [create, onSubmit],
    );

    const onCancelCreate = useCallback(() => {
        setBusy(false);
        setFocused(false);
        setPushState(undefined);
        setDescription('');
        onCancel?.();
    }, [onCancel]);

    const onStateSelect = useCallback((state: State) => {
        setPushState((prev) => (state.id === prev?.id ? undefined : state));
    }, []);

    return (
        <ActivityFeedItem>
            <UserPic size={32} src={user?.image} email={user?.email} />

            <CommentForm
                goalId={currentGoal}
                stateId={pushState?.id}
                description={description}
                focused={focused}
                busy={busy}
                onDescriptionChange={setDescription}
                onSubmit={createComment}
                onCancel={onCancelCreate}
                onFocus={onCommentFocus}
                actionButton={
                    states ? (
                        <StyledStateUpdate>
                            <Button
                                view="primary"
                                disabled={busy}
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
