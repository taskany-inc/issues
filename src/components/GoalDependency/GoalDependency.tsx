import { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AutoCompleteRadioGroup, CheckboxInput } from '@taskany/bricks';
import { Goal } from '@prisma/client';

import { trpc } from '../../utils/trpcClient';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { CustomCell, GoalListItemCompact } from '../GoalListItemCompact';
import { Title } from '../Table';
import { UserGroup } from '../UserGroup';
import { GoalSelect } from '../GoalSelect';
import {
    goalDependenciesInput,
    goalDependenciesRadios,
    goalDependenciesSuggestionItemTitle,
} from '../../utils/domObjects';

import { tr } from './GoalDependency.i18n';

const StyledCheckboxInput = styled(CheckboxInput)`
    margin: 0;
`;

interface GoalDependencyProps {
    id: string;
    items: { kind: dependencyKind; goals: Goal[] }[];
    onSubmit: (values: ToggleGoalDependency) => void;
}

export const GoalDependency: FC<GoalDependencyProps> = ({ id, items = [], onSubmit }) => {
    const [goalQuery, setGoalQuery] = useState('');
    const [kind, setKind] = useState(dependencyKind.blocks);

    const selectedGoals = useMemo(() => {
        return items.flatMap(({ goals }) => goals);
    }, [items]);

    const { data: goals = [] } = trpc.goal.suggestions.useQuery({
        input: goalQuery,
        limit: 5,
    });

    const radios = useMemo(() => {
        return [
            {
                title: tr('blocks'),
                value: dependencyKind.blocks,
            },
            {
                title: tr('dependsOn'),
                value: dependencyKind.dependsOn,
            },
            {
                title: tr('relatedTo'),
                value: dependencyKind.relatedTo,
            },
        ];
    }, []);

    const handleClick = useCallback(
        (item: { id: string }) => {
            const data = {
                id,
                kind,
                relation: { id: item.id },
            };

            onSubmit(data);
        },
        [id, kind, onSubmit],
    );

    return (
        <GoalSelect
            items={goals}
            value={selectedGoals}
            onClick={handleClick}
            renderItem={(props) => (
                <GoalListItemCompact
                    icon
                    rawIcon={<StyledCheckboxInput checked={props.checked} value={props.item.id} />}
                    item={props.item}
                    columns={[
                        {
                            name: 'title',
                            renderColumn: (values) => (
                                <CustomCell col={6}>
                                    <Title size="s" {...goalDependenciesSuggestionItemTitle.attr}>
                                        {values.title}
                                    </Title>
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
            )}
        >
            <FilterAutoCompleteInput onChange={setGoalQuery} {...goalDependenciesInput.attr} />
            <AutoCompleteRadioGroup
                title={tr('Kind')}
                items={radios}
                name="Kind"
                onChange={({ value }) => setKind(value)}
                value={kind}
                {...goalDependenciesRadios.attr}
            />
        </GoalSelect>
    );
};
