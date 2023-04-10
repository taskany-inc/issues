/* eslint-disable no-nested-ternary */
import React, { useCallback, useState, ChangeEvent, useEffect } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { gapS, gray3, gray8, radiusS, textColor } from '@taskany/colors';

import { nullable } from '../utils/nullable';

import { Icon } from './Icon';
import { Tag } from './Tag';
import { Input } from './Input';
import { Text } from './Text';
import { MenuItem } from './MenuItem';

const ComboBox = dynamic(() => import('@taskany/bricks/components/ComboBox'));

interface FormMultiInputProps {
    items?: Array<{ title: string; id: any }>;
    id?: string;
    name?: string;
    label?: string;
    query?: string;
    value?: Array<{ title: string; id: any }>;
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (value: Array<{ title: string; id: any }>) => void;
    onInput?: (query: string) => void;
    onClick?: (item: { title: string; id: any }) => void;
}

const StyledFormInputContainer = styled.div`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;

    border-radius: ${radiusS};

    background-color: ${gray3};
    color: ${textColor};
    font-weight: 600;
    font-size: 22px;
    width: 100%;
`;

const StyledLabel = styled(Text)`
    padding: 8px 8px 8px 16px;

    background-color: transparent;
`;

const StyledInput = styled(Input)`
    min-width: 100px;
`;

const StyledComboBox = styled(ComboBox)`
    margin-left: ${gapS};
`;

export const FormMultiInput = React.forwardRef<HTMLDivElement, FormMultiInputProps>(
    (
        { name, id, items, label, value = [], query = '', error, disabled, placeholder, onChange, onInput, onClick },
        ref,
    ) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(query);

        useEffect(() => {
            onInput?.(inputState);
        }, [inputState, onInput]);

        const onValueDelete = useCallback(
            (deleted: { title: string; id: any }) => () => {
                onChange?.(value.filter((item) => item.id !== deleted.id));
            },
            [onChange, value],
        );

        const onValueAdd = useCallback(
            (added: { title: string; id: any }) => {
                onChange?.([...value, added]);
            },
            [onChange, value],
        );

        return (
            <StyledFormInputContainer>
                {nullable(label, (l) => (
                    <StyledLabel as="label" htmlFor={id || name} size="m" color={gray8} weight="bold">
                        {l}:
                    </StyledLabel>
                ))}

                {value.map((item) => (
                    <Tag key={item.id} title={item.title} onHide={onValueDelete(item)} />
                ))}

                <StyledComboBox
                    ref={ref}
                    value={inputState}
                    visible={completionVisible}
                    error={error}
                    disabled={disabled}
                    onChange={onValueAdd}
                    items={items}
                    renderTrigger={(props) => <Icon ref={props.ref} type="plus" size="xs" onClick={props.onClick} />}
                    renderInput={(props) => (
                        <StyledInput
                            autoFocus
                            disabled={props.disabled}
                            placeholder={placeholder}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setInputState(e.currentTarget.value);
                                setCompletionVisibility(true);
                            }}
                            {...props}
                        />
                    )}
                    renderItem={(props) => (
                        <MenuItem
                            ghost
                            key={props.item.id}
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
                        >
                            {props.item.title}
                        </MenuItem>
                    )}
                />
            </StyledFormInputContainer>
        );
    },
);
