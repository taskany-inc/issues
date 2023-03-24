/* eslint-disable react/display-name */
import React, { ChangeEvent, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { Button } from '@common/Button';
import { Icon } from '@common/Icon';
import { Input } from '@common/Input';
import { MenuItem } from '@common/MenuItem';

import { createFetcher } from '../utils/createFetcher';
import { Flow } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

const ComboBox = dynamic(() => import('@common/ComboBox'));

interface FlowComboBoxProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: Partial<Flow>;
    query?: string;
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (flow: Flow) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

const fetcher = createFetcher((_, query: string) => ({
    flowCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
            },
        },
    ],
}));

export const FlowComboBox = React.forwardRef<HTMLDivElement, FlowComboBoxProps>(
    ({ text, value, disabled, query = '', error, placeholder, onChange }, ref) => {
        const { user } = usePageContext();
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);

        const { data } = useSWR(inputState, (q) => fetcher(user, q));

        return (
            <ComboBox
                ref={ref}
                text={value?.title || text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                items={data?.flowCompletion}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button
                        ghost
                        ref={props.ref}
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<Icon noWrap size="s" type="flow" />}
                    />
                )}
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
                    <MenuItem key={props.item.id} focused={props.cursor === props.index} onClick={props.onClick}>
                        {props.item.title}
                    </MenuItem>
                )}
            />
        );
    },
);
