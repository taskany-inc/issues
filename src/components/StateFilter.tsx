import { FC, useMemo } from 'react';

import { ColorizedFilterDropdown } from './ColorizedFilterDropdown';

type State = { id: string; title: string; hue: number };

export const StateFilter: FC<{
    text: string;
    value: string[];
    states: State[];
    onChange: (value: string[]) => void;
}> = ({ text, value, states, onChange }) => {
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

    return <ColorizedFilterDropdown text={text} items={items} value={value} onChange={onChange} />;
};
