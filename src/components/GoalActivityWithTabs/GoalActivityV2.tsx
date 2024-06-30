import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { nullable } from '@taskany/bricks';
import { Badge, Spinner, Switch, SwitchControl } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { safeUserData } from '../../utils/getUserName';
import { GoalComments, GoalActivityHistory } from '../../../trpc/inferredTypes';
import { CommentView } from '../CommentView/CommentView';
import { ActivityFeed } from '../ActivityFeed/ActivityFeed';
import { HistoryRecordGroup } from '../HistoryRecord/HistoryRecord';

import { tr } from './GoalActivityWithTabs.i18n';
import styles from './GoalActivityWithTabs.module.css';

interface GoalActivityProps {
    goalId: string;
    renderCommentItem: (item: React.ComponentProps<typeof CommentView> & { activityId: string }) => React.ReactNode;
}

type AllowedTabs = 'comments' | 'activity';
type MixedActivityFeed =
    | {
          type: 'comment';
          value: GoalComments[number];
      }
    | {
          type: 'history';
          value: GoalActivityHistory[number];
      };

type ExtraMixedActivityFeed =
    | {
          type: 'comment';
          value: GoalComments[number] & { author: ReturnType<typeof safeUserData> };
      }
    | {
          type: 'history';
          value: Array<
              Omit<GoalActivityHistory[number], 'activity' | 'activityId'> & { author: ReturnType<typeof safeUserData> }
          >;
      };

export const GoalActivityV2 = forwardRef<HTMLDivElement, React.PropsWithChildren<GoalActivityProps>>(
    ({ goalId, renderCommentItem, children }, ref) => {
        const [activeTab, setActiveTab] = useState<AllowedTabs>('comments');
        const [comments, historyFeed] = trpc.useQueries((ctx) => [
            ctx.goal.getGoalCommentsFeed({ goalId }),
            ctx.goal.getGoalActivityFeed({ goalId }),
        ]);
        const unionFeed = useMemo(() => {
            const res: ExtraMixedActivityFeed[] = [];

            const base: MixedActivityFeed[] = (comments.data || []).map((c) => ({
                type: 'comment',
                value: c,
            }));

            if (activeTab === 'activity') {
                // mixing comments with activity
                (historyFeed.data || []).forEach((h) =>
                    base.push({
                        type: 'history',
                        value: h,
                    }),
                );
            }

            const feed = base.sort((a, b) => a.value.createdAt.getTime() - b.value.createdAt.getTime());
            let tempRecords: Array<GoalActivityHistory[number] & { author: ReturnType<typeof safeUserData> }> = [];

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
        }, [activeTab, comments.data, historyFeed.data]);

        const isLoading = useMemo(() => {
            if (activeTab === 'comments') {
                return comments.isLoading;
            }

            return historyFeed.isLoading;
        }, [activeTab, comments.isLoading, historyFeed.isLoading]);

        const [commentCount, allActivityCount] = useMemo(() => {
            const commentsLength = comments.data?.length;
            const historyLength = historyFeed.data?.length;
            return [commentsLength, historyLength != null ? historyLength + (commentsLength ?? 0) : undefined];
        }, [comments.data, historyFeed.data]);

        const handleTabChange = useCallback((_: React.SyntheticEvent<HTMLButtonElement>, active: string) => {
            setActiveTab(active as AllowedTabs);
        }, []);

        return (
            <ActivityFeed ref={ref}>
                <Switch name="goalTabs" value="comments" animated onChange={handleTabChange}>
                    <SwitchControl
                        className={styles.GoalActivityTab}
                        value="comments"
                        count={commentCount}
                        text={tr('Comments')}
                    />
                    <SwitchControl
                        className={styles.GoalActivityTab}
                        value="activity"
                        count={allActivityCount}
                        text={tr('Activity')}
                    />
                </Switch>

                {nullable(
                    isLoading,
                    () => (
                        <div className={styles.GoalTabLoader}>
                            <Badge iconLeft={<Spinner size="s" />} text={tr('Loading ...')} />
                        </div>
                    ),
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
                                                ({
                                                    id,
                                                    action,
                                                    author,
                                                    subject,
                                                    nextValue,
                                                    previousValue,
                                                    createdAt,
                                                }) => ({
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
                    </div>,
                )}
                {children}
            </ActivityFeed>
        );
    },
);
