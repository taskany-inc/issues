import { useCallback, useMemo } from 'react';
import { Tab } from '@taskany/bricks';

import { StateType } from '../../trpc/inferredTypes';

import { FilterBase } from './FilterBase/FilterBase';
import { FilterCheckbox } from './FilterCheckbox';
import { StateDot } from './StateDot';
import { FilterTabLabel } from './FilterTabLabel';

interface State {
    id: string;
    title: string;
    hue: number;
    type: StateType;
}

interface StateFilterProps {
    text: string;
    value?: string[];
    states: State[];
    stateTypes?: string[];
    onStateChange: (value: string[]) => void;
    onStateTypeChange: (value: StateType[]) => void;
}

const getId = (state: State) => state.id;

export const StateFilter: React.FC<StateFilterProps> = ({
    text,
    value = [],
    states,
    stateTypes = [],
    onStateChange,
    onStateTypeChange,
}) => {
    const values = useMemo(() => {
        if (stateTypes.length) {
            return states.filter(({ type }) => stateTypes.includes(type));
        }

        return states.filter(({ id }) => value.includes(id));
    }, [stateTypes, states, value]);

    const onChange = useCallback(
        (value: string[]) => {
            onStateTypeChange([]);
            onStateChange(value);
        },
        [onStateChange, onStateTypeChange],
    );

    return (
        <Tab name="state" label={<FilterTabLabel text={text} selected={values.map(({ title }) => title)} />}>
            <FilterBase
                key="state"
                mode="multiple"
                viewMode="union"
                onChange={onChange}
                items={states}
                value={values}
                keyGetter={getId}
                renderItem={(props) => (
                    <FilterCheckbox
                        name="state"
                        value={props.item.id}
                        onClick={props.onItemClick}
                        checked={props.checked}
                        focused={props.active}
                        onMouseLeave={props.onMouseLeave}
                        onMouseMove={props.onMouseMove}
                        iconLeft={<StateDot hue={props.item.hue} />}
                        label={props.item.title}
                    />
                )}
            />
        </Tab>
    );
};
