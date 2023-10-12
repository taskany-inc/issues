import React, { forwardRef } from 'react';
import { nullable } from '@taskany/bricks';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { HistoryAction } from '../types/history';

import { ActivityFeed } from './ActivityFeed';
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
    HistoryRecordPartnerProject,
} from './HistoryRecord/HistoryRecord';

interface GoalActivityProps {
    feed: NonNullable<GoalByIdReturnType>['_activityFeed'];
    header?: React.ReactNode;
    footer?: React.ReactNode;

    renderCommentItem: (item: NonNullable<GoalByIdReturnType>['comments'][number]) => React.ReactNode;
}

function excludeString<T>(val: T): Exclude<T, string> {
    return val as Exclude<T, string>;
}

export const GoalActivity = forwardRef<HTMLDivElement, GoalActivityProps>(
    ({ feed, header, footer, renderCommentItem }, ref) => {
        return (
            <ActivityFeed ref={ref}>
                {header}

                {feed.map((item) =>
                    nullable(item, ({ type, value }) => (
                        <React.Fragment key={value.id}>
                            {type === 'comment' && renderCommentItem(value)}

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
                                            from={excludeString(value.previousValue)}
                                            to={excludeString(value.nextValue)}
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
                                    {value.subject === 'partnerProject' && (
                                        <HistoryRecordPartnerProject
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

                {footer}
            </ActivityFeed>
        );
    },
);
