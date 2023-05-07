import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button, Input, ComboBox } from '@taskany/bricks';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { trpc } from '../utils/trpcClient';

import { ProjectMenuItem } from './ProjectMenuItem';

interface GoalParentComboBoxProps {
    text: React.ComponentProps<typeof ComboBox>['text'];
    value?: { id: string; title: string };
    query?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (project: { id: string; title: string }) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

export const GoalParentComboBox = React.forwardRef<HTMLDivElement, GoalParentComboBoxProps>(
    ({ text, query = '', value, placeholder, disabled, error, onChange }, ref) => {
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);
        const [recentProjectsCache] = useLocalStorage('recentProjectsCache', {});

        useEffect(() => {
            setInputState(value?.title || query);
        }, [value, query]);

        const { data } = trpc.project.suggestions.useQuery(inputState);

        const recentProjects = Object.values(recentProjectsCache)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 10) // top 10
            .map((p) => p.cache);

        const items = useMemo(() => (data && data?.length > 0 ? data : recentProjects), [data, recentProjects]);

        return (
            <ComboBox
                ref={ref}
                text={value ? `#${value?.id}` : text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                placement="top-start"
                items={items}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button disabled={props.disabled} ref={props.ref} text={props.text} onClick={props.onClick} />
                )}
                renderInput={(props) => (
                    <StyledInput
                        autoFocus
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setInputState(e.currentTarget.value);
                            setCompletionVisibility(true);
                        }}
                        {...props}
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
        );
    },
);
