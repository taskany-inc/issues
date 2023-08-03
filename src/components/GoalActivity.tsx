import React, { forwardRef } from 'react';
import { nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { State } from '@prisma/client';

import { Priority } from '../types/priority';
import { useHighlightedComment } from '../hooks/useHighlightedComment';
import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { HistoryAction } from '../types/history';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DraftComment } from '../types/draftComment';

import { ActivityFeed } from './ActivityFeed';
import { CommentView } from './CommentView/CommentView';
import {
    HistoryRecord,
    HistoryRecordDependency,
    HistoryRecordTags,
    HistoryRecordTextChange,
    HistoryRecordEstimate,
    HistoryRecordPriority,
    HistoryRecordState,
    HistoryRecordParticipant,
    HistoryRecordProject,
    HistoryRecordLongTextChange,
    HistoryRecordCriteria,
} from './HistoryRecord/HistoryRecord';

const CommentCreateForm = dynamic(() => import('./CommentCreateForm/CommentCreateForm'));

interface GoalActivityProps {
    feed: NonNullable<GoalByIdReturnType>['_activityFeed'];
    userId?: string | null;
    onCommentReaction: (id: string) => (val?: string | undefined) => Promise<void>;
    onCommentPublish: (id?: string) => void;
    onCommentDelete: (id?: string) => void;
    goalId: string;
    goalStates?: State[];
    children: React.ReactNode;
}

function excludeString<T>(val: T): Exclude<T, string> {
    return val as Exclude<T, string>;
}

export const GoalActivity = forwardRef<HTMLDivElement, GoalActivityProps>(
    ({ feed, onCommentReaction, onCommentPublish, userId, goalId, goalStates, onCommentDelete, children }, ref) => {
        const [draftComment, setDraftComment] = useLocalStorage('draftGoalComment', {});
        const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();

        const onPublish = (id?: string) => {
            onCommentPublish(id);
            setHighlightCommentId(id);
        };

        const onDraftComment = (comment: DraftComment | null) => {
            setDraftComment((prev) => {
                if (comment) {
                    prev[goalId] = comment;
                } else {
                    delete prev[goalId];
                }
                return prev;
            });
        };

        return (
            <ActivityFeed ref={ref}>
                {children}
                {feed.map((item) =>
                    nullable(item, ({ type, value }) => (
                        <React.Fragment key={value.id}>
                            {type === 'comment' && (
                                <CommentView
                                    id={value.id}
                                    author={value.activity?.user}
                                    description={value.description}
                                    state={value.state}
                                    createdAt={value.createdAt}
                                    isEditable={value.activity?.id === userId}
                                    isNew={value.id === highlightCommentId}
                                    reactions={value.reactions}
                                    onReactionToggle={onCommentReaction(value.id)}
                                    onDelete={onCommentDelete}
                                />
                            )}
                            {type === 'history' && (
                                <HistoryRecord
                                    author={value.activity.user}
                                    id={value.id}
                                    subject={excludeString(value.subject)}
                                    action={excludeString(value.action)}
                                    createdAt={value.createdAt}
                                >
                                    {value.subject === 'dependencies' && (
                                        <HistoryRecordDependency
                                            issues={
                                                excludeString(value.previousValue || value.nextValue)?.map((val) => {
                                                    return {
                                                        ...val,
                                                        _shortId: `${val.projectId}-${val.scopeId}`,
                                                    };
                                                }, []) || []
                                            }
                                            strike={!!value.previousValue}
                                        />
                                    )}
                                    {value.subject === 'tags' && (
                                        <HistoryRecordTags
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                        />
                                    )}
                                    {value.subject === 'description' && (
                                        <HistoryRecordLongTextChange from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'title' && (
                                        <HistoryRecordTextChange from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'estimate' && (
                                        <HistoryRecordEstimate
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                        />
                                    )}
                                    {value.subject === 'priority' && (
                                        <HistoryRecordPriority
                                            from={value.previousValue as Priority}
                                            to={value.nextValue as Priority}
                                        />
                                    )}
                                    {value.subject === 'state' && (
                                        <HistoryRecordState
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                        />
                                    )}
                                    {(value.subject === 'participants' || value.subject === 'owner') && (
                                        <HistoryRecordParticipant
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                        />
                                    )}
                                    {value.subject === 'project' && (
                                        <HistoryRecordProject
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                        />
                                    )}
                                    {value.subject === 'criteria' && (
                                        <HistoryRecordCriteria
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
                                            action={value.action as HistoryAction}
                                        />
                                    )}
                                </HistoryRecord>
                            )}
                        </React.Fragment>
                    )),
                )}

                <CommentCreateForm
                    goalId={goalId}
                    states={goalStates}
                    onSubmit={onPublish}
                    onDraftComment={onDraftComment}
                    draftComment={draftComment?.[goalId]}
                />
            </ActivityFeed>
        );
    },
);
