import { nullable } from '@taskany/bricks';
import { State } from '@taskany/bricks/harmony';
import { ComponentProps, FC, ReactNode, useCallback } from 'react';
import styled from 'styled-components';

import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { goalPageHeader } from '../utils/domObjects';
import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { usePageContext } from '../hooks/usePageContext';

import StateSwitch from './StateSwitch';
import { IssueStats } from './IssueStats/IssueStats';
import { IssueTitle } from './IssueTitle';

const StyledGoalHeader = styled.div`
    display: grid;
    grid-template-columns: 1fr max-content;
`;

const StyledPublicActions = styled.div`
    display: flex;
    align-items: center;
`;

const StyledGoalInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => `
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        `
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
`;

interface GoalHeaderProps
    extends Pick<ComponentProps<typeof IssueTitle>, 'href' | 'size'>,
        Pick<ComponentProps<typeof IssueStats>, 'onCommentsClick'> {
    goal?: Partial<GoalByIdReturnType>;
    actions?: ReactNode;
    children?: ReactNode;

    onGoalStateChange?: ComponentProps<typeof StateSwitch>['onClick'];
}

export const GoalHeader: FC<GoalHeaderProps> = ({
    goal,
    actions,
    children,
    href,
    size,
    onGoalStateChange,
    onCommentsClick,
}) => {
    const { theme } = usePageContext();

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
        <StyledGoalHeader {...goalPageHeader.attr}>
            <StyledGoalInfo align="left">
                {children}

                {nullable(goal?.title, (title) => (
                    <IssueTitle title={title} href={href} size={size} />
                ))}

                {nullable(goal, (g) => (
                    <StyledPublicActions>
                        {nullable(g?.state, (s) =>
                            g._isEditable && g.project?.flowId ? (
                                <StateSwitch
                                    state={{
                                        id: s.id,
                                        title: s.title,
                                        type: s.type,
                                        lightBackground: s.lightBackground || undefined,
                                        lightForeground: s.lightForeground || undefined,
                                        darkBackground: s.darkBackground || undefined,
                                        darkForeground: s.darkForeground || undefined,
                                    }}
                                    flowId={g.project.flowId}
                                    onClick={onStateChangeHandler}
                                />
                            ) : (
                                <State title={s.title} color={s[`${theme}Foreground`] || undefined} />
                            ),
                        )}

                        {nullable(g.updatedAt, (date) => (
                            <IssueStats
                                estimate={g.estimate}
                                estimateType={g.estimateType}
                                priority={g.priority?.title}
                                achivedCriteriaWeight={g._hasAchievementCriteria ? g._achivedCriteriaWeight : undefined}
                                comments={g._count?.comments ?? 0}
                                hasPrivateDeps={g._hasPrivateDeps}
                                onCommentsClick={onCommentsClick}
                                updatedAt={date}
                            />
                        ))}
                    </StyledPublicActions>
                ))}
            </StyledGoalInfo>
            {nullable(actions, (ac) => (
                <StyledGoalInfo align="right">{ac}</StyledGoalInfo>
            ))}
        </StyledGoalHeader>
    );
};
