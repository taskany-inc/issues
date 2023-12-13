import React, { forwardRef, useMemo } from 'react';
import { nullable } from '@taskany/bricks';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { GoalComment } from '../types/comment';
import { safeUserData } from '../utils/getUserName';

import { ActivityFeed } from './ActivityFeed';
import { HistoryRecordGroup } from './HistoryRecord/HistoryRecord';

interface GoalActivityProps {
    feed: NonNullable<GoalByIdReturnType>['_activityFeed'];
    header?: React.ReactNode;
    footer?: React.ReactNode;

    renderCommentItem: (item: GoalComment) => React.ReactNode;
}

export const GoalActivity = forwardRef<HTMLDivElement, GoalActivityProps>(
    ({ feed, header, footer, renderCommentItem }, ref) => {
        const unionFeed = useMemo(() => {
            const res = [];
            let tempRecords = [];

            for (let i = 0; i < feed.length; i += 1) {
                const current = feed[i];
                const next = feed[i + 1];

                if (current.type === 'history') {
                    if (current.type === next?.type && current.value.subject === next.value.subject) {
                        tempRecords.push(current.value);
                    } else {
                        res.push({
                            type: current.type,
                            value: tempRecords.concat([current.value]),
                        });

                        tempRecords = [];
                    }
                } else {
                    // only comments
                    res.push(current);
                }
            }

            return res;
        }, [feed]);

        return (
            <ActivityFeed ref={ref}>
                {header}

                {unionFeed.map((item) =>
                    nullable(item, ({ type, value }) => {
                        if (type === 'history') {
                            return (
                                <HistoryRecordGroup
                                    key={`${type}.${value.length}${value.at(-1)?.id ?? ''}`}
                                    subject={value[value.length - 1].subject}
                                    groupped={value.length > 1}
                                    values={value.map(
                                        ({ id, action, subject, nextValue, previousValue, activity, createdAt }) => ({
                                            author: safeUserData(activity),
                                            from: previousValue,
                                            to: nextValue,
                                            action,
                                            id,
                                            subject,
                                            createdAt,
                                        }),
                                    )}
                                />
                            );
                        }

                        return <React.Fragment key={value.id}>{renderCommentItem(value)}</React.Fragment>;
                    }),
                )}

                {footer}
            </ActivityFeed>
        );
    },
);
