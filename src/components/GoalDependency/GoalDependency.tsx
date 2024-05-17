import { FC, useCallback, useMemo, useState } from 'react';
import { AutoCompleteRadioGroup, CheckboxInput } from '@taskany/bricks';
import { UserGroup } from '@taskany/bricks/harmony';
import { Goal } from '@prisma/client';

import { trpc } from '../../utils/trpcClient';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { CustomCell, GoalListItemCompact } from '../GoalListItemCompact/GoalListItemCompact';
import { TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { safeUserData } from '../../utils/getUserName';
import { GoalSelect } from '../GoalSelect/GoalSelect';
import {
    goalDependenciesInput,
    goalDependenciesRadios,
    goalDependenciesSuggestionItemTitle,
} from '../../utils/domObjects';

import { tr } from './GoalDependency.i18n';
import s from './GoalDependency.module.css';

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
                    rawIcon={
                        <CheckboxInput
                            className={s.GoalDependencyCheckbox}
                            checked={props.active}
                            value={props.item.id}
                        />
                    }
                    item={props.item}
                    columns={[
                        {
                            name: 'title',
                            renderColumn: (values) => (
                                <CustomCell width="50%">
                                    <TableRowItemTitle size="s" {...goalDependenciesSuggestionItemTitle.attr}>
                                        {values.title}
                                    </TableRowItemTitle>
                                </CustomCell>
                            ),
                        },
                        {
                            name: 'state',
                            columnProps: {
                                forIcon: true,
                            },
                        },
                        {
                            name: 'projectId',
                        },
                        {
                            name: 'issuers',
                            renderColumn: (values) => (
                                <CustomCell width={45}>
                                    <UserGroup users={values.issuers.map(safeUserData).filter(Boolean)} size="xs" />
                                </CustomCell>
                            ),
                        },
                    ]}
                />
            )}
        >
            <FilterAutoCompleteInput onChange={setGoalQuery} autoFocus {...goalDependenciesInput.attr} />
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
