import { ComponentProps, useCallback } from 'react';
import { AutoComplete, AutoCompleteList, MenuItem } from '@taskany/bricks/harmony';

import { tr } from './GoalSelect.i18n';

interface WithId {
    id: string;
}

interface GoalSelectProps<T extends WithId> extends Omit<ComponentProps<typeof AutoComplete<T>>, 'onChange'> {
    onClick: (item: T) => void;
}

export const GoalSelect = <T extends WithId>({
    children,
    onClick,
    renderItem,
    mode = 'multiple',
    value,
    items,
}: GoalSelectProps<T>) => {
    const onClickHandler = useCallback(
        (values: { item: T; onChange: () => void }) => () => {
            values.onChange();
            onClick(values.item);
        },
        [onClick],
    );

    return (
        <AutoComplete
            value={value}
            items={items}
            mode={mode}
            renderItem={(props) => (
                <MenuItem
                    hovered={props.active || props.hovered}
                    onClick={onClickHandler({
                        item: props.item,
                        onChange: props.onChange,
                    })}
                    onMouseMove={props.onMouseMove}
                    onMouseLeave={props.onMouseLeave}
                >
                    {renderItem?.(props)}
                </MenuItem>
            )}
        >
            {children}
            <AutoCompleteList title={tr('Suggestions')} filterSelected />
        </AutoComplete>
    );
};
