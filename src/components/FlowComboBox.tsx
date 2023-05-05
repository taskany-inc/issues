/* eslint-disable react/display-name */
import React, { ChangeEvent, useState } from 'react';
import styled from 'styled-components';
import { Flow } from '@prisma/client';
import { Button, Input, ComboBox, FlowIcon, MenuItem } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';

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

export const FlowComboBox = React.forwardRef<HTMLDivElement, FlowComboBoxProps>(
    ({ text, value, disabled, query = '', error, placeholder, onChange }, ref) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);

        const suggestions = trpc.flow.suggestions.useQuery(inputState);

        return (
            <ComboBox
                ref={ref}
                text={value?.title || text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                items={suggestions.data}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button
                        ghost
                        ref={props.ref}
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<FlowIcon noWrap size="s" />}
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
