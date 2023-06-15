import { useCallback, useMemo, memo } from 'react';
import styled from 'styled-components';
import { Text, CircleIcon, TickCirclecon, MessageTickIcon, GoalIcon, nullable } from '@taskany/bricks';
import { State } from '@prisma/client';
import { backgroundColor, brandColor, gray10, gray6, gray7, gray9 } from '@taskany/colors';

import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../../schema/criteria';
import { TitleItem, TitleContainer, Title, ContentItem, TextItem, Table } from '../Table';
import { StateDot } from '../StateDot';
import { ActivityFeedItem } from '../ActivityFeed';
import { ActivityByIdReturnType, GoalEstimate, GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { estimateToString } from '../../utils/estimateToString';
import { UserGroup } from '../UserGroup';

import { tr } from './GoalCriterion.i18n';

const StyledActivityFeedItem = styled(ActivityFeedItem)`
    padding-top: 20px;
    padding-left: 4px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledIcon = styled(MessageTickIcon)`
    width: 24px;
    height: 24px;
    display: flex;
    background-color: ${gray7};
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transform: translateY(-3px);
    border-radius: 50%;
    padding: 2px;
    box-sizing: border-box;

    text-align: center;
`;

const StyledCircleIcon = styled(CircleIcon)`
    width: 15px;
    height: 15px;
    display: inline-flex;
    color: ${gray9};
`;

const StyledTickIcon = styled(TickCirclecon)`
    background-color: ${brandColor};
    color: ${backgroundColor};
    border-radius: 50%;
    width: 15px;
    height: 15px;
    display: inline-flex;
`;

const StyledCheckboxWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

interface GoalCreteriaCheckBoxProps {
    checked: boolean;
    onClick: () => void;
}

const GoalCreteriaCheckBox: React.FC<GoalCreteriaCheckBoxProps> = ({ checked, onClick }) => {
    const Icon = !checked ? StyledCircleIcon : StyledTickIcon;
    return (
        <StyledCheckboxWrapper onClick={onClick}>
            <Icon size="s" />
        </StyledCheckboxWrapper>
    );
};

const StyledTable = styled(Table)`
    grid-template-columns: 14px minmax(300px, 30%) repeat(4, max-content) 1fr;
    column-gap: 10px;
    margin-bottom: 10px;
`;

const StyledTableRow = styled.div`
    display: contents;
    & > *,
    & > *:first-child,
    & > *:last-child {
        padding: 0;
    }
`;

const StyledHeading = styled(Text)`
    padding-bottom: 7px;
    display: block;
`;

interface GoalCriteriaProps {
    isDone: boolean;
    title: string;
    weight: number;
    projectId?: string | null;
    issuer?: ActivityByIdReturnType | null;
    owner?: ActivityByIdReturnType | null;
    estimate?: GoalEstimate | null;
    state?: State | null;
    onCheck?: (val: boolean) => void;
}

const GoalCriteria: React.FC<GoalCriteriaProps> = memo(
    ({ isDone, title, weight, estimate, owner, issuer, projectId, state, onCheck }) => {
        const onToggle = useCallback(() => {
            onCheck?.(!isDone);
        }, [onCheck, isDone]);

        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }, [issuer, owner]);

        return (
            <StyledTableRow>
                <ContentItem>
                    {projectId == null ? (
                        <GoalCreteriaCheckBox onClick={onToggle} checked={isDone} />
                    ) : (
                        <GoalIcon size="s" />
                    )}
                </ContentItem>
                <TitleItem>
                    <TitleContainer>
                        <Title color={gray10} weight={projectId ? 'bolder' : 'regular'}>
                            {title}
                        </Title>
                    </TitleContainer>
                </TitleItem>
                <ContentItem>
                    <Text weight="bold" size="s" color={gray9}>
                        {weight}
                    </Text>
                </ContentItem>
                <ContentItem>
                    {nullable(state, (s) => (
                        <StateDot size="m" title={s?.title} hue={s?.hue} />
                    ))}
                </ContentItem>
                <ContentItem>
                    {nullable(projectId, (p) => (
                        <TextItem>{p}</TextItem>
                    ))}
                </ContentItem>
                <ContentItem align="center">
                    {nullable(issuers.length, () => (
                        <UserGroup users={issuers} size={18} />
                    ))}
                </ContentItem>
                <ContentItem>
                    <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
                </ContentItem>
            </StyledTableRow>
        );
    },
);

interface GoalCriterionProps {
    goalId?: string;
    criterion?: GoalAchiveCriteria[];
    onAddCriteria: (val: AddCriteriaScheme) => void;
    onToggleCriteria: (val: UpdateCriteriaScheme) => void;
    onRemoveCriteria: (val: RemoveCriteriaScheme) => void;
    renderForm: (props: {
        onAddCriteria: GoalCriterionProps['onAddCriteria'];
        sumOfWeights: number;
    }) => React.ReactNode;
}

export const GoalCriterion: React.FC<GoalCriterionProps> = ({
    goalId,
    criterion = [],
    onAddCriteria,
    onToggleCriteria,
    // onRemoveCriteria,
    renderForm,
}) => {
    const onAddHandler = useCallback(
        (val: AddCriteriaScheme) => {
            if (goalId) {
                onAddCriteria({
                    ...val,
                    linkedGoalId: goalId,
                });
            }
        },
        [onAddCriteria, goalId],
    );
    const sumOfWeights = useMemo(() => {
        return criterion.reduce((acc, { weight }) => acc + weight, 0);
    }, [criterion]);

    return (
        <StyledActivityFeedItem>
            <StyledIcon size="s" color={backgroundColor} />
            <Wrapper>
                <StyledHeading color={gray6} weight="bold">
                    {tr('Achivement Criteria')}
                </StyledHeading>
                <StyledTable columns={7}>
                    {criterion.map((item) => (
                        <GoalCriteria
                            key={item.title}
                            title={item.title}
                            weight={item.weight}
                            isDone={item.isDone}
                            projectId={item.goalAsCriteria?.projectId}
                            estimate={
                                item.goalAsCriteria?.estimate[(item.goalAsCriteria?.estimate.length ?? 0) - 1]?.estimate
                            }
                            owner={item.goalAsCriteria?.owner}
                            issuer={item.goalAsCriteria?.activity}
                            state={item.goalAsCriteria?.state}
                            onCheck={(state) => onToggleCriteria({ ...item, isDone: state })}
                        />
                    ))}
                </StyledTable>
                {renderForm({ onAddCriteria: onAddHandler, sumOfWeights })}
            </Wrapper>
        </StyledActivityFeedItem>
    );
};
