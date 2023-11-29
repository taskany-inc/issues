import { ComponentProps, ReactNode, useCallback } from 'react';
import { MenuItem, nullable } from '@taskany/bricks';

import { FilterBase } from './FilterBase/FilterBase';

interface GoalSelectProps<T> extends Pick<ComponentProps<typeof FilterBase<T>>, 'items' | 'value'> {
    children: ReactNode;
    onClick: (item: T) => void;
    renderItem: ComponentProps<typeof FilterBase<T>>['renderItem'];
}

const keyGetter = (item: { id: string }) => item.id;

export const GoalSelect = <T extends { id: string }>({
    children,
    onClick,
    renderItem,
    ...props
}: GoalSelectProps<T>) => {
    const onClickHandler = useCallback(
        (values: { item: T; onClick: () => void }) => () => {
            values.onClick();
            onClick(values.item);
        },
        [onClick],
    );

    return (
        <FilterBase
            mode="multiple"
            viewMode="split"
            keyGetter={keyGetter}
            renderItem={(props) =>
                nullable(!props.checked, () => (
                    <MenuItem
                        ghost
                        focused={props.active || props.hovered}
                        onClick={onClickHandler({
                            item: props.item,
                            onClick: props.onItemClick,
                        })}
                        onMouseMove={props.onMouseMove}
                        onMouseLeave={props.onMouseLeave}
                    >
                        {renderItem(props)}
                    </MenuItem>
                ))
            }
            {...props}
        >
            {children}
        </FilterBase>
    );
};
