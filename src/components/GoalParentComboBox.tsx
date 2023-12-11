import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ComboBox, FormControl, FormControlError, FormControlInput, nullable } from '@taskany/bricks';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { trpc } from '../utils/trpcClient';
import { projectsCombobox, comboboxInput, combobox, comboboxErrorDot } from '../utils/domObjects';

import { ProjectMenuItem } from './ProjectMenuItem';

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
        const [recentProjectsCache] = useLocalStorage('recentProjectsCache', {});

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

        const recentProjects = Object.values(recentProjectsCache)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 10) // top 10
            .map((p) => p.cache);

        const items = useMemo(() => (data && data?.length > 0 ? data : recentProjects), [data, recentProjects]);

        const onClickOutside = useCallback((cb: () => void) => {
            cb();
        }, []);

        return (
            <FormControl variant="outline" {...combobox.attr}>
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
                            placeholder={placeholder}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setInputState(e.currentTarget.value);
                                setCompletionVisibility(true);
                            }}
                            {...props}
                            {...comboboxInput.attr}
                        />
                    )}
                    renderItem={(props) => (
                        <ProjectMenuItem
                            key={props.item.id}
                            title={props.item.title}
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
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
