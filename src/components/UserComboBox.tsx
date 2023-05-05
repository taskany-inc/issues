import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { Button, ComboBox, UserPic, Input, UserMenuItem } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

interface UserComboBoxProps {
    text: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: Partial<NonNullable<ActivityByIdReturnType>>;
    disabled?: boolean;
    placeholder?: string;
    filter?: string[];
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (activity: NonNullable<ActivityByIdReturnType>) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

export const UserComboBox = React.forwardRef<HTMLDivElement, UserComboBoxProps>(
    ({ text, query = '', value, filter, disabled, placeholder, error, onChange }, ref) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(
            value?.user?.name || value?.user?.email || value?.ghost?.email || query,
        );

        const suggestions = trpc.user.suggestions.useQuery({
            query: inputState,
            filter: filter || [],
        });

        return (
            <ComboBox
                ref={ref}
                text={value?.user?.name || value?.user?.email || value?.ghost?.email || text}
                value={inputState}
                visible={completionVisible}
                disabled={disabled}
                error={error}
                placement="top-start"
                items={suggestions.data}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={
                            value ? (
                                <UserPic
                                    src={value?.user?.image}
                                    email={value?.user?.email || value?.ghost?.email}
                                    size={16}
                                />
                            ) : undefined
                        }
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
                    <UserMenuItem
                        key={props.item.id}
                        name={props.item.user?.name}
                        email={props.item.user?.email || props.item.ghost?.email}
                        image={props.item.user?.image}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
