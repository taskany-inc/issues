import React, { ChangeEvent, useState } from 'react';
import { Flow } from '@prisma/client';
import { ComboBox, MenuItem, FormControl, FormControlInput } from '@taskany/bricks';
import { IconGitPullOutline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

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
                        view="ghost"
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={<IconGitPullOutline size="s" />}
                    />
                )}
                renderInput={(props) => (
                    <FormControl variant="outline">
                        <FormControlInput
                            autoFocus
                            disabled={props.disabled}
                            placeholder={placeholder}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setInputState(e.currentTarget.value);
                                setCompletionVisibility(true);
                            }}
                            {...props}
                        />
                    </FormControl>
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
