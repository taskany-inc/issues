import React, { ComponentProps, forwardRef, useMemo } from 'react';
import { nullable } from '@taskany/bricks';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { safeUserData } from '../utils/getUserName';

import { ActivityFeed } from './ActivityFeed';
import { HistoryRecordGroup } from './HistoryRecord/HistoryRecord';
import type { CommentView } from './CommentView/CommentView';

interface GoalActivityProps {
    feed: NonNullable<GoalByIdReturnType>['_activityFeed'];
    header?: React.ReactNode;
    footer?: React.ReactNode;

    renderCommentItem: (item: ComponentProps<typeof CommentView> & { activityId: string }) => React.ReactNode;
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
                    tempRecords.push({
                        ...current.value,
                        author: safeUserData(current.value.activity),
                    });

                    if (current.type === next?.type && current.value.subject === next.value.subject) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }

                    res.push({
                        type: current.type,
                        value: tempRecords,
                    });

                    tempRecords = [];
                } else {
                    // only comments
                    res.push({
                        type: current.type,
                        value: {
                            ...current.value,
                            author: safeUserData(current.value.activity),
                            state: current.value.state ?? undefined,
                        },
                    });
                }
            }

            return res;
        }, [feed]);

        return (
            <ActivityFeed ref={ref}>
                {header}

                <div>
                    {unionFeed.map((item) =>
                        nullable(item, ({ type, value }) => {
                            if (type === 'history') {
                                return (
                                    <HistoryRecordGroup
                                        key={`${type}.${value.length}${value.at(-1)?.id ?? ''}`}
                                        subject={value[value.length - 1].subject}
                                        groupped={value.length > 1}
                                        values={value.map(
                                            ({ id, action, author, subject, nextValue, previousValue, createdAt }) => ({
                                                author,
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
                </div>

                {footer}
            </ActivityFeed>
        );
    },
);
