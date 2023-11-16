import { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AutoCompleteRadioGroup, CheckboxInput, nullable } from '@taskany/bricks';
import { Goal } from '@prisma/client';

import { trpc } from '../../utils/trpcClient';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { FilterBase } from '../FilterBase/FilterBase';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { CustomCell, GoalListItemCompact } from '../GoalListItemCompact';
import { Title } from '../Table';
import { UserGroup } from '../UserGroup';

import { tr } from './GoalDependency.i18n';

const StyledCheckboxInput = styled(CheckboxInput)`
    margin: 0;
`;

const StyledGoalListItemCompact = styled(GoalListItemCompact)`
    cursor: pointer;
`;

interface GoalDependencyProps {
    id: string;
    items: { kind: dependencyKind; goals: Goal[] }[];
    onSubmit: (values: ToggleGoalDependency) => void;
}

const getId = (item: { id: string }) => item.id;

export const GoalDependency: FC<GoalDependencyProps> = ({ id, items = [], onSubmit }) => {
    const [goalQuery, setGoalQuery] = useState('');
    const [kind, setKind] = useState(dependencyKind.dependsOn);

    const selectedGoals = useMemo(() => {
        return items.flatMap(({ goals }) => goals);
    }, [items]);

    const { data: goals = [] } = trpc.goal.suggestions.useQuery(
        {
            input: goalQuery,
            limit: 5,
        },
        {
            staleTime: 0,
            cacheTime: 0,
        },
    );

    const radios = useMemo(() => {
        return [
            {
                title: tr('dependsOn'),
                value: dependencyKind.dependsOn,
            },
            {
                title: tr('blocks'),
                value: dependencyKind.blocks,
            },
            {
                title: tr('relatedTo'),
                value: dependencyKind.relatedTo,
            },
        ];
    }, []);

    const handleClick = useCallback(
        (values: { id: string; onClick: () => void }) => () => {
            const data = {
                id,
                kind,
                relation: { id: values.id },
            };

            values.onClick();
            onSubmit(data);
        },
        [id, kind, onSubmit],
    );

    return (
        <FilterBase
            mode="multiple"
            viewMode="split"
            items={goals}
            keyGetter={getId}
            value={selectedGoals}
            renderItem={({ item, checked, onItemClick }) => {
                return nullable(!checked, () => (
                    <StyledGoalListItemCompact
                        icon
                        rawIcon={<StyledCheckboxInput checked={checked} value={getId(item)} />}
                        item={item}
                        onClick={handleClick({
                            id: getId(item),
                            onClick: onItemClick,
                        })}
                        columns={[
                            {
                                name: 'title',
                                renderColumn: (values) => (
                                    <CustomCell col={6}>
                                        <Title size="s">{values.title}</Title>
                                    </CustomCell>
                                ),
                            },
                            {
                                name: 'state',
                                columnProps: {
                                    min: true,
                                    forIcon: true,
                                },
                            },
                            {
                                name: 'projectId',
                                columnProps: {
                                    col: 1,
                                },
                            },
                            {
                                name: 'issuers',
                                renderColumn: (values) => (
                                    <CustomCell align="start" width={45}>
                                        <UserGroup users={values.issuers} size={18} />
                                    </CustomCell>
                                ),
                            },
                        ]}
                    />
                ));
            }}
        >
            <FilterAutoCompleteInput onChange={setGoalQuery} />
            <AutoCompleteRadioGroup
                title={tr('Kind')}
                items={radios}
                name="Kind"
                onChange={({ value }) => setKind(value as dependencyKind)}
                value={kind}
            />
        </FilterBase>
    );
};
