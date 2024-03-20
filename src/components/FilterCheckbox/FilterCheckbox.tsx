import React from 'react';
import { Checkbox, CheckboxInput, CheckboxLabel, nullable } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './FilterCheckbox.module.css';

type CheckboxProps = React.ComponentProps<typeof Checkbox> & React.ComponentProps<typeof CheckboxInput>;

interface FilterCheckboxProps extends CheckboxProps {
    label: string;
    iconLeft?: React.ReactNode;
    focused?: boolean;
}

export const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
    name,
    onClick,
    checked,
    focused,
    value,
    label,
    iconLeft,
    ...attr
}) => (
    <Checkbox
        className={cn(s.FilterCheckbox, { [s.FilterCheckbox_focused]: focused })}
        name={name}
        onClick={onClick}
        {...attr}
    >
        <CheckboxInput className={s.CheckboxInput} checked={checked} value={value} />
        <CheckboxLabel className={s.FilterCheckboxLabel}>
            {nullable(iconLeft, (icon) => icon)}
            <Text weight="bold" size="s">
                {label}
            </Text>
        </CheckboxLabel>
    </Checkbox>
);
