import React, { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { danger0, gapM, gapS } from '@taskany/colors';
import {
    Dot,
    Button,
    Card,
    CardComment,
    CardInfo,
    Dropdown,
    Link,
    MoreVerticalIcon,
    BinIcon,
    EditIcon,
    MenuItem,
    ModalContent,
    ModalHeader,
    ModalPreview,
    UserPic,
    nullable,
} from '@taskany/bricks';

import { refreshInterval } from '../../utils/config';
import { formatEstimate } from '../../utils/dateTime';
import { useHighlightedComment } from '../../hooks/useHighlightedComment';
import { routes } from '../../hooks/router';
import { usePageContext } from '../../hooks/usePageContext';
import { useReactionsResource } from '../../hooks/useReactionsResource';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { editGoalKeys } from '../../utils/hotkeys';
import { Priority, priorityColorsMap } from '../../types/priority';
import { IssueKey } from '../IssueKey';
import { IssueTitle } from '../IssueTitle';
import { IssueParent } from '../IssueParent';
import { IssueTags } from '../IssueTags';
import { StateDot } from '../StateDot';
import RelativeTime from '../RelativeTime/RelativeTime';
import Md from '../Md';
import { IssueStats } from '../IssueStats/IssueStats';
import { CommentView } from '../CommentView/CommentView';
import { ActivityFeed } from '../ActivityFeed';
import { Reactions } from '../Reactions';
import ReactionsDropdown from '../ReactionsDropdown';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { getPriorityText } from '../PriorityText/PriorityText';
import { trpc } from '../../utils/trpcClient';
import { notifyPromise } from '../../utils/notifyPromise';
import { GoalStateChangeSchema } from '../../schema/goal';

import { tr } from './GoalPreview.i18n';

const StateSwitch = dynamic(() => import('../StateSwitch'));
const CommentCreateForm = dynamic(() => import('../CommentCreateForm/CommentCreateForm'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));

interface GoalPreviewProps {
    preview: {
        _shortId: string;
        id: string;
        title: string;
        description?: string | null;
        updatedAt: Date;
    };

    onClose?: () => void;
    onDelete?: () => void;
}

const StyledImportantActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StyledPublicActions = styled.div`
    display: flex;
    align-items: center;

    & > * {
        margin-right: ${gapS};
    }
`;

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledModalContent = styled(ModalContent)`
    overflow: auto;
    height: 70vh;

    padding-top: ${gapM};
`;

const StyledCard = styled(Card)`
    min-height: 60px;
`;

const GoalPreview: React.FC<GoalPreviewProps> = ({ preview, onClose, onDelete }) => {
    const { user, locale } = usePageContext();
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const [isRelativeTime, setIsRelativeTime] = useState(true);

    const onChangeTypeDate = () => {
        setIsRelativeTime(!isRelativeTime);
    };

    const archiveMutation = trpc.goal.toggleArchive.useMutation();
    const utils = trpc.useContext();

    const { data: goal } = trpc.goal.getById.useQuery(preview._shortId, {
        staleTime: refreshInterval,
    });

    const [goalEditModalVisible, setGoalEditModalVisible] = useState(false);
    const onGoalEdit = useCallback(() => {
        setGoalEditModalVisible(false);

        utils.goal.getById.invalidate(preview._shortId);
    }, [utils.goal.getById, preview._shortId]);
    const onGoalEditModalShow = useCallback(() => {
        setGoalEditModalVisible(true);
    }, []);

    const onGoalEditModalClose = useCallback(() => {
        setGoalEditModalVisible(false);
    }, []);

    const { reactionsProps, goalReaction, commentReaction } = useReactionsResource(goal?.reactions);

    const priorityColor = priorityColorsMap[goal?.priority as Priority];

    const stateChangeMutations = trpc.goal.switchState.useMutation();
    const onGoalStateChange = useCallback(
        async (nextState: GoalStateChangeSchema['state']) => {
            if (goal) {
                await stateChangeMutations.mutateAsync({
                    id: goal.id,
                    state: nextState,
                });
            }

            utils.goal.getById.invalidate(preview._shortId);
        },
        [goal, preview._shortId, stateChangeMutations, utils.goal.getById],
    );

    const onCommentPublish = useCallback(
        (id?: string) => {
            utils.goal.getById.invalidate(preview._shortId);
            setHighlightCommentId(id);
        },
        [preview._shortId, utils.goal.getById, setHighlightCommentId],
    );

    const onGoalReactionToggle = useCallback(
        (id: string) => goalReaction(id, () => utils.goal.getById.invalidate(preview._shortId)),
        [preview._shortId, goalReaction, utils.goal.getById],
    );
    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, () => utils.goal.getById.invalidate(preview._shortId)),
        [preview._shortId, commentReaction, utils.goal.getById],
    );

    const onPreviewClose = useCallback(() => {
        setGoalEditModalVisible(false);
        onClose?.();
    }, [onClose]);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const onGoalDeleteConfirm = useCallback(async () => {
        onDelete?.();
        const promise = archiveMutation.mutateAsync({
            id: preview.id,
            archived: true,
        });

        await notifyPromise(promise, 'goalsDelete');

        utils.goal.getById.invalidate(preview._shortId);
    }, [preview, onDelete, archiveMutation, utils.goal.getById]);

    const commentsRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const onCommentsClick = useCallback(() => {
        commentsRef.current &&
            contentRef.current &&
            headerRef.current &&
            contentRef.current.scrollTo({
                behavior: 'smooth',
                top: commentsRef.current.offsetTop - headerRef.current.offsetHeight,
            });
    }, []);

    return (
        <>
            <ModalPreview visible onClose={onPreviewClose}>
                <StyledModalHeader ref={headerRef}>
                    {nullable(preview.id, () => (
                        <IssueKey size="s" id={preview._shortId}>
                            {nullable(goal?.tags, (tags) => (
                                <IssueTags tags={tags} size="s" />
                            ))}
                        </IssueKey>
                    ))}

                    {Boolean(goal?.project?.parent?.length) &&
                        nullable(goal?.project?.parent, (parent) => (
                            <>
                                <IssueParent as="span" mode="compact" parent={parent} size="m" />
                                <Dot />
                            </>
                        ))}

                    {nullable(goal?.project, (project) => (
                        <IssueParent as="span" mode="compact" parent={project} size="m" />
                    ))}

                    <IssueStats
                        mode="compact"
                        comments={goal?._count?.comments ?? 0}
                        onCommentsClick={onCommentsClick}
                        updatedAt={(goal || preview).updatedAt}
                    />

                    {nullable((goal || preview).title, (title) => (
                        <IssueTitle title={title} href={routes.goal(preview._shortId)} size="xl" />
                    ))}

                    <StyledImportantActions>
                        <StyledPublicActions>
                            {nullable(goal?.state, (s) => (
                                <StateSwitch state={s} flowId={goal?.project?.flowId} onClick={onGoalStateChange} />
                            ))}

                            {nullable(goal?.priority, (ip) => (
                                <Button
                                    ghost
                                    text={getPriorityText(ip as Priority)}
                                    iconLeft={<StateDot hue={priorityColor} />}
                                />
                            ))}

                            <Button
                                ghost
                                text={goal?.owner?.user?.name || goal?.owner?.user?.email || goal?.owner?.ghost?.email}
                                iconLeft={
                                    <UserPic
                                        src={goal?.owner?.user?.image}
                                        email={goal?.owner?.user?.email || goal?.owner?.ghost?.email}
                                        size={16}
                                    />
                                }
                            />

                            {nullable(goal?._lastEstimate, (ie) => (
                                <Button ghost text={formatEstimate(ie, locale)} />
                            ))}

                            <Reactions reactions={reactionsProps.reactions} onClick={onGoalReactionToggle(preview.id)}>
                                {nullable(!reactionsProps.limited, () => (
                                    <ReactionsDropdown onClick={onGoalReactionToggle(preview.id)} />
                                ))}
                            </Reactions>
                        </StyledPublicActions>

                        {nullable(goal?._isEditable, () => (
                            <Dropdown
                                onChange={onEditMenuChange}
                                items={[
                                    {
                                        label: tr('Edit'),
                                        icon: <EditIcon size="xxs" />,
                                        onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
                                    },
                                    {
                                        label: tr('Delete'),
                                        color: danger0,
                                        icon: <BinIcon size="xxs" />,
                                        onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
                                    },
                                ]}
                                renderTrigger={({ ref, onClick }) => (
                                    <Button
                                        ref={ref}
                                        ghost
                                        iconLeft={<MoreVerticalIcon noWrap size="xs" />}
                                        onClick={onClick}
                                    />
                                )}
                                renderItem={({ item, cursor, index, onClick }) => (
                                    <MenuItem
                                        key={item.label}
                                        ghost
                                        color={item.color}
                                        focused={cursor === index}
                                        icon={item.icon}
                                        onClick={onClick}
                                    >
                                        {item.label}
                                    </MenuItem>
                                )}
                            />
                        ))}
                    </StyledImportantActions>
                </StyledModalHeader>
                <StyledModalContent ref={contentRef}>
                    <StyledCard>
                        <CardInfo onClick={onChangeTypeDate}>
                            <Link inline>{goal?.activity?.user?.name}</Link> —{' '}
                            {nullable(goal?.createdAt, (date) => (
                                <RelativeTime isRelativeTime={isRelativeTime} date={date} />
                            ))}
                        </CardInfo>

                        <CardComment>
                            <Md>{(goal || preview).description ?? ''}</Md>
                        </CardComment>
                    </StyledCard>

                    {nullable(goal?.comments, (comments) => (
                        <ActivityFeed ref={commentsRef}>
                            {comments.map((comment) =>
                                nullable(comment, (c) => (
                                    <CommentView
                                        key={c.id}
                                        id={c.id}
                                        author={c.activity?.user}
                                        description={c.description}
                                        createdAt={c.createdAt}
                                        isEditable={c.activity?.id === user?.activityId}
                                        isNew={c.id === highlightCommentId}
                                        reactions={c.reactions}
                                        onReactionToggle={onCommentReactionToggle(c.id)}
                                    />
                                )),
                            )}

                            <CommentCreateForm goalId={preview.id} onSubmit={onCommentPublish} />
                        </ActivityFeed>
                    ))}
                </StyledModalContent>
            </ModalPreview>

            {nullable(goal, (g) =>
                nullable(g._isEditable, () => (
                    <>
                        <ModalOnEvent
                            event={ModalEvent.GoalEditModal}
                            hotkeys={editGoalKeys}
                            visible={goalEditModalVisible}
                            onShow={onGoalEditModalShow}
                            onClose={onGoalEditModalClose}
                        >
                            <GoalEditForm goal={g} onSubmit={onGoalEdit} />
                        </ModalOnEvent>

                        <GoalDeleteModal shortId={g._shortId} onConfirm={onGoalDeleteConfirm} />
                    </>
                )),
            )}
        </>
    );
};

export default GoalPreview;
