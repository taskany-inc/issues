import React from 'react';
import styled from 'styled-components';
import { Checkbox, CheckboxInput, CheckboxLabel } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

const StyledCheckboxLabel = styled(CheckboxLabel)`
    display: inline-flex;
    gap: ${gapXs};
    align-items: baseline;
`;

type CheckboxProps = React.ComponentProps<typeof Checkbox> & React.ComponentProps<typeof CheckboxInput>;

interface FilterCheckboxProps extends CheckboxProps {}

export const FilterCheckbox: React.FC<React.PropsWithChildren<FilterCheckboxProps>> = ({
    name,
    onClick,
    checked,
    value,
    children,
}) => (
    <Checkbox name={name} onClick={onClick}>
        <CheckboxInput checked={checked} value={value} />
        <StyledCheckboxLabel>{children}</StyledCheckboxLabel>
    </Checkbox>
);
