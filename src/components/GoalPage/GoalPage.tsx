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
import { issuePage } from '../../utils/domObjects';

import { tr } from './GoalPage.i18n';

const GoalContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: ${gapM};
`;

interface TagObject {
    id: string;
    title: string;
    description?: string | null;
}

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

    const { goalProjectChange, onGoalStateChange, onGoalWatchingToggle, onGoalStarToggle, goalTagsUpdate, invalidate } =
        useGoalResource({ id: goal?.id }, { invalidate: { getById: id } });

    const onGoalTagAdd = useCallback(
        async (value: TagObject[]) => {
            if (!goal) return;

            await goalTagsUpdate([...goal.tags, ...value]);

            invalidate();
        },
        [goal, invalidate, goalTagsUpdate],
    );

    const onGoalTagRemove = useCallback(
        (value: TagObject) => async () => {
            if (!goal) return;

            const tags = goal.tags.filter((tag) => tag.id !== value.id);
            await goalTagsUpdate(tags);

            invalidate();
        },
        [goal, invalidate, goalTagsUpdate],
    );

    const onGoalTransfer = useCallback(
        async (project?: { id: string }) => {
            if (!project) return;

            const transferedGoal = await goalProjectChange(project.id);
            if (transferedGoal) {
                router.goal(transferedGoal._shortId);
            }
        },
        [goalProjectChange, router],
    );

    const pageTitle = tr
        .raw('title', {
            goal: goal?.title,
        })
        .join('');

    const { setPreview } = useGoalPreview();

    const onGoalCriteriaClick = useCallback(
        (item: GoalAchiveCriteria) => {
            if (item.goalAsCriteria) {
                const { projectId, scopeId, title, description, updatedAt } = item.goalAsCriteria;
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

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!goal) return null;

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle} {...issuePage.attr}>
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
                        onGoalDependencyClick={onGoalDependencyClick}
                        onGoalDeleteConfirm={router.goals}
                    />
                </div>

                <div>
                    <GoalSidebar
                        goal={goal}
                        onGoalTagRemove={onGoalTagRemove}
                        onGoalTagAdd={onGoalTagAdd}
                        onGoalTransfer={onGoalTransfer}
                    />
                </div>
            </GoalContent>
        </Page>
    );
};
