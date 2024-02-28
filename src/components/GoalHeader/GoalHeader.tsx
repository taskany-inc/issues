import { nullable } from '@taskany/bricks';
import { ComponentProps, FC, ReactNode, useCallback } from 'react';
import { Dot } from '@taskany/bricks/harmony';
import cn from 'classnames';

import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { goalPageHeader } from '../../utils/domObjects';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { IssueStats } from '../IssueStats/IssueStats';
import { IssueTitle } from '../IssueTitle';
import { StateDropdown } from '../StateDropdown/StateDropdown';
import { IssueParent } from '../IssueParent/IssueParent';

import s from './GoalHeader.module.css';

interface GoalHeaderProps
    extends Pick<ComponentProps<typeof IssueTitle>, 'href' | 'size'>,
        Pick<ComponentProps<typeof IssueStats>, 'onCommentsClick'> {
    goal?: Partial<GoalByIdReturnType>;
    actions?: ReactNode;

    onGoalStateChange?: ComponentProps<typeof StateDropdown>['onChange'];
}

export const GoalHeader: FC<GoalHeaderProps> = ({ goal, actions, href, size, onGoalStateChange, onCommentsClick }) => {
    const onStateChangeHandler = useCallback<NonNullable<GoalHeaderProps['onGoalStateChange']>>(
        (val) => {
            onGoalStateChange?.(val);
            dispatchModalEvent(ModalEvent.GoalPreviewModal, {
                type: 'on:goal:update',
            });
        },
        [onGoalStateChange],
    );
    return (
        <div className={s.GoalHeader} {...goalPageHeader.attr}>
            <div className={s.GoalHeaderInfo_align_left}>
                <div className={s.GoalHeaderTitle}>
                    {nullable(goal?.title, (title) => (
                        <IssueTitle title={title} href={href} size={size} />
                    ))}

                    {nullable(goal?.project, (project) => (
                        <div className={s.GoalHeaderParents}>
                            {nullable(project?.parent, (parent) => (
                                <>
                                    <IssueParent parent={parent} size="m" />
                                    <Dot className={s.GoalHeaderParentDot} />
                                </>
                            ))}

                            <IssueParent parent={project} size="m" />
                        </div>
                    ))}
                </div>

                {nullable(goal, (g) => {
                    const readOnly = !(g._isEditable && g.project?.flowId);
                    return (
                        <div className={s.GoalHeaderStats}>
                            {nullable(g?.state, (state) => (
                                <StateDropdown
                                    label="State"
                                    value={state}
                                    readOnly={readOnly}
                                    flowId={g.project?.flowId}
                                    className={cn({
                                        [s.GoalHeaderStateDropdown_readOnly]: readOnly,
                                    })}
                                    view={readOnly ? 'default' : 'fill'}
                                    onChange={onStateChangeHandler}
                                />
                            ))}

                            <IssueStats
                                owner={g.owner}
                                estimate={g.estimate}
                                estimateType={g.estimateType}
                                priority={g.priority}
                                achivedCriteriaWeight={g._hasAchievementCriteria ? g._achivedCriteriaWeight : undefined}
                                comments={g._count?.comments ?? 0}
                                hasPrivateDeps={g._hasPrivateDeps}
                                stateReadOnly={readOnly}
                                onCommentsClick={onCommentsClick}
                            />
                        </div>
                    );
                })}
            </div>
            {nullable(actions, (ac) => (
                <div className={s.GoalHeaderInfo_align_right}>{ac}</div>
            ))}
        </div>
    );
};
