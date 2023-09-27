import React, { useState, ChangeEvent, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Button, ComboBox, UserPic, Input, UserMenuItem, nullable } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { getUserName, prepareUserDataFromActivity } from '../utils/getUserName';

interface UserComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: Partial<NonNullable<ActivityByIdReturnType>>;
    disabled?: boolean;
    placeholder?: string;
    filter?: string[];
    error?: React.ComponentProps<typeof ComboBox>['error'];
    placement?: React.ComponentProps<typeof ComboBox>['placement'];
    offset?: React.ComponentProps<typeof ComboBox>['offset'];
    renderTrigger?: React.ComponentProps<typeof ComboBox>['renderTrigger'];

    onChange?: (activity: NonNullable<ActivityByIdReturnType>) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

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
            if (value == null) {
                return query;
            }

            const current = prepareUserDataFromActivity(value);
            if (current != null) {
                const existingName = getUserName(current);

                return existingName;
            }

            return query;
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

        const textValue = useMemo(() => {
            if (value) {
                const current = prepareUserDataFromActivity(value);

                return current?.name || current?.email || text;
            }

            return text;
        }, [value, text]);

        return (
            <ComboBox
                ref={ref}
                text={textValue}
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
                        renderTrigger(props)
                    ) : (
                        <Button
                            text={props.text}
                            disabled={props.disabled}
                            onClick={props.onClick}
                            iconLeft={nullable(value, (v) =>
                                nullable(prepareUserDataFromActivity(v), (user) => (
                                    <UserPic src={user?.image} email={user?.email} size={16} />
                                )),
                            )}
                        />
                    )
                }
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
                        name={getUserName(props.item.user)}
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
