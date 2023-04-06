import React, { useContext, createContext, useCallback } from 'react';
import styled from 'styled-components';
import { gapS, gray3, gray8, radiusS } from '@taskany/colors';

import { nullable } from '../utils/nullable';

import { Text } from './Text';

interface FormRadioContext {
    name: FormRadioProps['name'];
    value: FormRadioProps['value'];

    onChange?: (v: FormRadioProps['value']) => void;
}

const radioContext = createContext<FormRadioContext>({
    name: undefined,
    value: undefined,
    onChange: undefined,
});

interface FormRadioInputProps {
    name?: string;
    label?: string;
    value: string;
    defaultValue?: string | number;
    tabIndex?: number;
    disabled?: boolean;
}

const StyledFormRadioInputContainer = styled.div`
    padding: 8px 16px;

    & + & {
        padding-left: 0;
    }
`;
const StyledFormRadioInput = styled.input``;
const StyledFormRadioInputLabel = styled(Text)`
    padding-left: ${gapS};
`;

export const FormRadioInput: React.FC<FormRadioInputProps> = (props) => {
    const { name, value, onChange } = useContext(radioContext);

    const onRadioInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange && onChange(e.target.value);
        },
        [onChange],
    );

    return (
        <StyledFormRadioInputContainer>
            <StyledFormRadioInput
                type="radio"
                checked={props.value === value}
                name={name}
                onChange={onRadioInputChange}
                id={props.value}
                {...props}
            />
            {nullable(props.label, (l) => (
                <StyledFormRadioInputLabel as="label" htmlFor={props.value}>
                    {l}
                </StyledFormRadioInputLabel>
            ))}
        </StyledFormRadioInputContainer>
    );
};

interface FormRadioProps {
    name?: string;
    label?: string;
    value?: string;
    flat?: 'top' | 'bottom' | 'both';
    children?: React.ReactNode;

    onChange?: (v: FormRadioProps['value']) => void;
}

const StyledFormRadio = styled.div<{ flat: FormRadioProps['flat'] }>`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;

    border-radius: ${radiusS};

    background-color: ${gray3};

    ${({ flat }) =>
        flat === 'top' &&
        `
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        `
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'both' &&
        `
            border-radius: 0;
        `}
`;

const StyledFormRadioLabel = styled(Text)`
    padding: 8px 8px 8px 16px;

    background-color: transparent;
`;

export const FormRadio: React.FC<FormRadioProps> = ({ label, flat, name, value, onChange, children }) => {
    return (
        <radioContext.Provider value={{ name, value, onChange }}>
            <StyledFormRadio flat={flat}>
                {nullable(label, (l) => (
                    <StyledFormRadioLabel as="label" size="m" color={gray8} weight="bold">
                        {l}:
                    </StyledFormRadioLabel>
                ))}

                {children}
            </StyledFormRadio>
        </radioContext.Provider>
    );
};
