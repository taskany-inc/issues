import React, { useCallback, useEffect, useRef } from 'react';
import { nullable } from '@taskany/bricks';
import { IconEdit1Outline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Page } from '../Page/Page';
import { PageActions } from '../PageActions/PageActions';
import { PageSep } from '../PageSep/PageSep';
import { IssueKey } from '../IssueKey';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { WatchButton } from '../WatchButton/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { useRouter } from '../../hooks/router';
import { StarButton } from '../StarButton/StarButton';
import { trpc } from '../../utils/trpcClient';
import { refreshInterval } from '../../utils/config';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { useFMPMetric } from '../../utils/telemetry';
import { GoalSidebar } from '../GoalSidebar/GoalSidebar';
import { GoalHeader } from '../GoalHeader/GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed/GoalActivityFeed';
import { goalPage, goalPageEditButton } from '../../utils/domObjects';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { CommonHeader } from '../CommonHeader';

import { tr } from './GoalPage.i18n';
import s from './GoalPage.module.css';

export const GoalPage = ({ user, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    useFMPMetric(!!goal);

    const { project } = goal || {};

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && !project.personal && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { onGoalStateChange, onGoalWatchingToggle, onGoalStarToggle, invalidate } = useGoalResource(
        { id: goal?.id },
        { invalidate: { getById: id } },
    );

    const pageTitle = tr
        .raw('title', {
            goal: goal?.title,
        })
        .join('');

    const { setPreview, on } = useGoalPreview();

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            invalidate();
        });

        const unsubDelete = on('on:goal:delete', () => {
            invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, invalidate]);

    const onGoalClick = useCallback(
        (goal: { _shortId: string }) => {
            setPreview(goal._shortId);
        },
        [setPreview],
    );

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!goal) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle} header={<CommonHeader />} {...goalPage.attr}>
            <GoalHeader
                goal={goal}
                onCommentsClick={onCommentsClick}
                onGoalStateChange={onGoalStateChange}
                actions={
                    <>
                        <PageActions>
                            <WatchButton watcher={Boolean(goal._isWatching)} onToggle={onGoalWatchingToggle} />
                            <StarButton
                                stargizer={Boolean(goal._isStarred)}
                                count={goal._count?.stargizers}
                                onToggle={onGoalStarToggle}
                            />
                        </PageActions>

                        <div className={s.GoalPageActionsWrapper}>
                            <PageActions>
                                <IssueKey id={id} />
                                {nullable(goal._isEditable, () => (
                                    <Button
                                        text={tr('Edit')}
                                        iconLeft={<IconEdit1Outline size="xs" />}
                                        onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                                        {...goalPageEditButton.attr}
                                    />
                                ))}
                            </PageActions>
                            {nullable(goal?.updatedAt, (date) => (
                                <RelativeTime kind="updated" date={date} />
                            ))}
                        </div>
                    </>
                }
            />

            <PageSep />

            <div className={s.GoalContent}>
                <div>
                    <GoalContentHeader date={goal.createdAt} description={goal.description} />

                    <GoalActivityFeed ref={commentsRef} goal={goal} shortId={id} onGoalDeleteConfirm={router.goals} />
                </div>

                <div>
                    <GoalSidebar
                        goal={goal}
                        onGoalTransfer={(transferredGoal) => router.goal(transferredGoal._shortId)}
                        onGoalClick={onGoalClick}
                    />
                </div>
            </div>
        </Page>
    );
};
