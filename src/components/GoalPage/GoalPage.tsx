import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { gapM } from '@taskany/colors';
import { Button, nullable } from '@taskany/bricks';
import { IconEditOutline } from '@taskany/icons';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { Page, PageContent, PageActions } from '../Page';
import { PageSep } from '../PageSep';
import { IssueKey } from '../IssueKey';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { WatchButton } from '../WatchButton/WatchButton';
import { useGoalResource } from '../../hooks/useGoalResource';
import { useRouter } from '../../hooks/router';
import { StarButton } from '../StarButton/StarButton';
import { trpc } from '../../utils/trpcClient';
import { refreshInterval } from '../../utils/config';
import { GoalAchiveCriteria, GoalDependencyItem } from '../../../trpc/inferredTypes';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { useFMPMetric } from '../../utils/telemetry';
import { GoalSidebar } from '../GoalSidebar/GoalSidebar';
import { GoalHeader } from '../GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed';
import { IssueParent } from '../IssueParent';
import { goalPage, goalPageEditButton } from '../../utils/domObjects';

import { tr } from './GoalPage.i18n';

const GoalContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: ${gapM};
`;

export const GoalPage = ({ user, ssrTime, params: { id } }: ExternalPageProps<{ id: string }>) => {
    const router = useRouter();

    const { data: goal } = trpc.goal.getById.useQuery(id, {
        staleTime: refreshInterval,
    });

    useFMPMetric(!!goal);

    const { project } = goal || {};

    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    useEffect(() => {
        project && setCurrentProjectCache(project);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const { onGoalStateChange, onGoalWatchingToggle, onGoalStarToggle, onGoalTransfer, invalidate } = useGoalResource(
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

    const onGoalCriteriaClick = useCallback(
        (item: GoalAchiveCriteria) => {
            if (item.criteriaGoal) {
                const { projectId, scopeId, title, description, updatedAt } = item.criteriaGoal;
                const shortId = `${projectId}-${scopeId}`;

                setPreview(shortId, {
                    title,
                    description,
                    updatedAt,
                });
            }
        },
        [setPreview],
    );

    const onGoalDependencyClick = useCallback(
        ({ projectId, scopeId, title, description, updatedAt }: GoalDependencyItem) => {
            const shortId = `${projectId}-${scopeId}`;

            setPreview(shortId, {
                title,
                description,
                updatedAt,
            });
        },
        [setPreview],
    );

    const onVersaGoalClick = useCallback(
        (shortId: string) => {
            setPreview(shortId);
        },
        [setPreview],
    );

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!goal) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle} {...goalPage.attr}>
            <PageContent>
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

                            <PageActions>
                                <IssueKey id={id} />
                                {nullable(goal._isEditable, () => (
                                    <Button
                                        text={tr('Edit')}
                                        iconLeft={<IconEditOutline size="xs" />}
                                        onClick={dispatchModalEvent(ModalEvent.GoalEditModal)}
                                        {...goalPageEditButton.attr}
                                    />
                                ))}
                            </PageActions>
                        </>
                    }
                >
                    {Boolean(project?.parent?.length) &&
                        nullable(project?.parent, (parent) => (
                            <>
                                <IssueParent size="m" parent={parent} />
                            </>
                        ))}

                    {nullable(project, (project) => (
                        <IssueParent parent={project} />
                    ))}
                </GoalHeader>
            </PageContent>

            <PageSep />

            <GoalContent>
                <div>
                    <GoalContentHeader date={goal.createdAt} description={goal.description} />

                    <GoalActivityFeed
                        ref={commentsRef}
                        goal={goal}
                        shortId={id}
                        onGoalCriteriaClick={onGoalCriteriaClick}
                        onGoalDeleteConfirm={router.goals}
                    />
                </div>

                <div>
                    <GoalSidebar
                        goal={goal}
                        onGoalTransfer={onGoalTransfer((transferredGoal) => router.goal(transferredGoal._shortId))}
                        onGoalDependencyClick={onGoalDependencyClick}
                        onGoalOpen={onVersaGoalClick}
                    />
                </div>
            </GoalContent>
        </Page>
    );
};
