import React, { useState, useCallback } from 'react';
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
    const [pushState, setPushState] = useState<State | undefined>();

    const createComment = useCallback(
        async (form: GoalCommentSchema) => {
            await create(({ id }) => {
                onSubmit?.(id);
                setPushState(undefined);
            })(form);
        },
        [create, onSubmit],
    );

    const onCancelCreate = useCallback(() => {
        setPushState(undefined);
        onCancel?.();
    }, [onCancel]);

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
                goalId={goalId}
                stateId={pushState?.id}
                onSubmit={createComment}
                onCancel={onCancelCreate}
                onFocus={onFocus}
                renderActionButton={({ busy }) =>
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
