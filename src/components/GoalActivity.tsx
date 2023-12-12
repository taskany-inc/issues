import React, { forwardRef } from 'react';
import { nullable } from '@taskany/bricks';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { GoalComment } from '../types/comment';

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

    renderCommentItem: (item: GoalComment) => React.ReactNode;
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
                                    subject={value.subject}
                                    action={value.action}
                                    createdAt={value.createdAt}
                                >
                                    {value.subject === 'dependencies' && (
                                        <HistoryRecordDependency
                                            issues={value.previousValue || value.nextValue}
                                            strike={!!value.previousValue}
                                        />
                                    )}
                                    {value.subject === 'tags' && (
                                        <HistoryRecordTags from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'description' && (
                                        <HistoryRecordLongTextChange from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'title' && (
                                        <HistoryRecordTextChange from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'estimate' && (
                                        <HistoryRecordEstimate from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'priority' && (
                                        <HistoryRecordPriority from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'state' && (
                                        <HistoryRecordState from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {(value.subject === 'participants' || value.subject === 'owner') && (
                                        <HistoryRecordParticipant from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'project' && (
                                        <HistoryRecordProject from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'partnerProject' && (
                                        <HistoryRecordPartnerProject from={value.previousValue} to={value.nextValue} />
                                    )}
                                    {value.subject === 'criteria' && (
                                        <HistoryRecordCriteria
                                            from={value.previousValue}
                                            to={value.nextValue}
                                            action={value.action}
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
