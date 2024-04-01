import { ComponentProps, ReactNode, useCallback } from 'react';
import { MenuItem, nullable } from '@taskany/bricks';

import { FilterBase } from './FilterBase/FilterBase';

type FilterBaseProps<T> = ComponentProps<typeof FilterBase<T>>;

interface GoalSelectProps<T> extends Pick<FilterBaseProps<T>, 'items' | 'value'> {
    mode?: FilterBaseProps<T>['mode'];
    viewMode?: FilterBaseProps<T>['viewMode'];
    children: ReactNode;
    onClick: (item: T) => void;
    renderItem: ComponentProps<typeof FilterBase<T>>['renderItem'];
}

const keyGetter = (item: { id: string }) => item.id;

export const GoalSelect = <T extends { id: string }>({
    children,
    onClick,
    renderItem,
    viewMode = 'split',
    mode = 'multiple',
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
            mode={mode}
            viewMode={viewMode}
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
