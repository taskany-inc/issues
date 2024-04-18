import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ComboBox, ListView, ListViewItem, nullable } from '@taskany/bricks';
import { Button, FormControl, FormControlError, FormControlInput, MenuItem } from '@taskany/bricks/harmony';

import { trpc } from '../utils/trpcClient';
import { projectsCombobox, comboboxInput, combobox, comboboxErrorDot } from '../utils/domObjects';

interface GoalParentComboBoxProps {
    text?: React.ComponentProps<typeof ComboBox>['text'];
    value?: { id: string; title: string };
    query?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: React.ComponentProps<typeof ComboBox>['error'];
    placement?: React.ComponentProps<typeof ComboBox>['placement'];
    offset?: React.ComponentProps<typeof ComboBox>['offset'];
    renderTrigger?: React.ComponentProps<typeof ComboBox>['renderTrigger'] & React.HTMLAttributes<HTMLElement>;

    onChange?: (project: { id: string; title: string }) => void;
}

export const GoalParentComboBox = React.forwardRef<HTMLDivElement, GoalParentComboBoxProps>(
    (
        {
            text,
            query = '',
            value,
            placeholder,
            disabled,
            error,
            placement = 'top-start',
            offset,
            renderTrigger,
            onChange,
        },
        ref,
    ) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);

        const { data: userProjects = [] } = trpc.project.getUserProjects.useQuery(undefined, {
            keepPreviousData: true,
        });

        useEffect(() => {
            setInputState(value?.title || query);
        }, [value, query]);

        const { data } = trpc.project.suggestions.useQuery(
            {
                query: inputState,
            },
            {
                enabled: inputState.length >= 2,
                cacheTime: 0,
                staleTime: 0,
            },
        );

        const items = useMemo(
            () => (data && data?.length > 0 ? data : userProjects.slice(0, 10)),
            [data, userProjects],
        );

        const onClickOutside = useCallback((cb: () => void) => {
            cb();
        }, []);

        return (
            <FormControl {...combobox.attr}>
                <ComboBox
                    ref={ref}
                    text={value ? `#${value?.id}` : text}
                    value={inputState}
                    visible={completionVisible}
                    disabled={disabled}
                    placement={placement}
                    offset={offset}
                    items={items}
                    onClickOutside={onClickOutside}
                    onChange={onChange}
                    renderTrigger={(props) =>
                        renderTrigger ? (
                            renderTrigger({
                                ...props,
                                ...projectsCombobox.attr,
                            })
                        ) : (
                            <Button
                                disabled={props.disabled}
                                text={props.text}
                                onClick={props.onClick}
                                {...projectsCombobox.attr}
                            />
                        )
                    }
                    renderInput={(props) => (
                        <FormControlInput
                            autoFocus
                            outline
                            placeholder={placeholder}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setInputState(e.currentTarget.value);
                                setCompletionVisibility(true);
                            }}
                            {...props}
                            {...comboboxInput.attr}
                        />
                    )}
                    renderItems={(children) => <ListView>{children}</ListView>}
                    renderItem={(props) => (
                        <ListViewItem
                            key={props.item.title}
                            value={props.item}
                            renderItem={({ hovered, active, ...viewProps }) => (
                                <MenuItem {...viewProps} hovered={hovered || active}>
                                    {props.item.title}
                                </MenuItem>
                            )}
                        />
                    )}
                />
                {nullable(error, (e) => (
                    <FormControlError error={e} {...comboboxErrorDot.attr} />
                ))}
            </FormControl>
        );
    },
);
