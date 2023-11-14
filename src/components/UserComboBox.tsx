import React, { useState, ChangeEvent, useCallback } from 'react';
import { Button, UserPic, UserMenuItem, nullable, FormControl, FormControlInput } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { safeGetUserEmail, safeGetUserImage, safeGetUserName, safeUserData } from '../utils/getUserName';
import { comboboxItem, usersCombobox, comboboxInput } from '../utils/domObjects';

import { CommonCombobox } from './CommonCombobox';

interface UserComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: Partial<NonNullable<ActivityByIdReturnType>>;
    disabled?: boolean;
    placeholder?: string;
    filter?: string[];
    error?: React.ComponentProps<typeof CommonCombobox>['error'];
    placement?: React.ComponentProps<typeof CommonCombobox>['placement'];
    offset?: React.ComponentProps<typeof CommonCombobox>['offset'];
    renderTrigger?: React.ComponentProps<typeof CommonCombobox>['renderTrigger'] & React.HTMLAttributes<HTMLElement>;

    onChange?: (activity: NonNullable<ActivityByIdReturnType>) => void;
}

export const UserComboBox = React.forwardRef<HTMLDivElement, UserComboBoxProps>(
    (
        {
            text,
            query = '',
            value,
            filter,
            disabled,
            placeholder,
            error,
            placement = 'top-start',
            offset,
            renderTrigger,
            onChange,
        },
        ref,
    ) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(() => {
            return safeGetUserName(value) || query;
        });

        const suggestions = trpc.user.suggestions.useQuery(
            {
                query: inputState,
                filter: filter || [],
            },
            {
                enabled: inputState.length >= 2,
                cacheTime: 0,
                staleTime: 0,
            },
        );

        const onClickOutside = useCallback((cb: () => void) => {
            cb();
        }, []);

        return (
            <CommonCombobox
                ref={ref}
                text={safeGetUserName(value) || text}
                value={inputState}
                visible={completionVisible}
                disabled={disabled}
                error={error}
                placement={placement}
                offset={offset}
                items={suggestions.data}
                onClickOutside={onClickOutside}
                onChange={onChange}
                renderTrigger={(props) =>
                    renderTrigger ? (
                        renderTrigger({
                            ...props,
                            ...usersCombobox.attr,
                        })
                    ) : (
                        <Button
                            text={props.text}
                            disabled={props.disabled}
                            onClick={props.onClick}
                            iconLeft={nullable(safeUserData(value), (props) => (
                                <UserPic src={props.image} email={props.email} name={props.name} size={16} />
                            ))}
                            {...usersCombobox.attr}
                        />
                    )
                }
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
                            {...comboboxInput.attr}
                        />
                    </FormControl>
                )}
                renderItem={(props) => (
                    <UserMenuItem
                        key={props.item.id}
                        name={safeGetUserName(props.item)}
                        email={safeGetUserEmail(props.item, false)}
                        image={safeGetUserImage(props.item)}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                        {...comboboxItem.attr}
                    />
                )}
            />
        );
    },
);
