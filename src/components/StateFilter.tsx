import { FC, useCallback, useMemo } from 'react';

import { ColorizedFilterDropdown } from './ColorizedFilterDropdown';

type State = { id: string; title: string; hue: number; type: string };

export const StateFilter: FC<{
    text: string;
    value: string[];
    states: State[];
    stateTypes: string[];
    onStateChange: (value: string[]) => void;
    onStateTypeChange: (value: string[]) => void;
}> = ({ text, value, states, stateTypes, onStateChange, onStateTypeChange }) => {
    const items = useMemo(
        () =>
            states.map((state) => ({
                id: state.id,
                data: {
                    text: state.title,
                    hue: state.hue,
                },
            })),
        [states],
    );

    const values = useMemo(() => {
        if (stateTypes.length) {
            return states.filter(({ type }) => stateTypes.includes(type)).map(({ id }) => id);
        }
        return value;
    }, [stateTypes, value, states]);

    const onChange = useCallback(
        (value: string[]) => {
            onStateTypeChange([]);
            onStateChange(value);
        },
        [onStateChange, onStateTypeChange],
    );

    return <ColorizedFilterDropdown text={text} items={items} value={values} onChange={onChange} />;
};
