import React from 'react';
import styled from 'styled-components';
import { Checkbox, CheckboxInput, CheckboxLabel, Text, nullable } from '@taskany/bricks';

const StyledCheckboxLabel = styled(CheckboxLabel)`
    display: inline-flex;
    gap: var(--gap-sm);
    align-items: center;
    margin-left: var(--gap-s);
`;

const StyledCheckbox = styled(Checkbox)<{ focused?: boolean }>`
    padding: var(--gap-xs) 0;
    border-radius: var(--radius-s);
    ${({ focused }) => focused && 'background-color: var(--gray4);'}
`;

const StyledChekboxInput = styled(CheckboxInput)`
    // aligned by icon in input
    margin-left: 9.5px;
`;

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
    <StyledCheckbox name={name} onClick={onClick} focused={focused} {...attr}>
        <StyledChekboxInput checked={checked} value={value} />
        <StyledCheckboxLabel>
            {nullable(iconLeft, (icon) => icon)}
            <Text weight="bold" size="s">
                {label}
            </Text>
        </StyledCheckboxLabel>
    </StyledCheckbox>
);
