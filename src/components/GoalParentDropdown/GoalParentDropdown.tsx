import { Text, Button } from '@taskany/bricks/harmony';
import { useState, useEffect, useMemo, ComponentProps, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { IconAddOutline } from '@taskany/icons';

import { useLocalStorage } from '../../hooks/useLocalStorage';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel } from '../Dropdown/Dropdown';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import s from './GoalParentDropdown.module.css';
import { tr } from './GoalParentDropdown.i18n';

interface GoalParentDropdownProps {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    value?: { id: string; title: string };
    query?: string;
    placeholder?: string;
    disabled?: boolean;
    onChange?: (project: { id: string; title: string }) => void;
}

export const GoalParentDropdown = ({
    label,
    query = '',
    value,
    placeholder,
    disabled,
    onChange,
    ...props
}: GoalParentDropdownProps) => {
    const [inputState, setInputState] = useState(query);
    const [recentProjectsCache] = useLocalStorage('recentProjectsCache', {});

    useEffect(() => {
        setInputState(query);
    }, [query]);

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

    const items = useMemo<typeof recentProjects | typeof data>(
        () => (data && data?.length > 0 ? data : recentProjects),
        [data, recentProjects],
    );

    const handleCreateProject = useCallback(() => {
        dispatchModalEvent(ModalEvent.GoalCreateModal)();
        dispatchModalEvent(ModalEvent.ProjectCreateModal)();
    }, []);

    return (
        <Dropdown>
            <DropdownTrigger label={label} className={s.DropdownTrigger} {...props} readOnly={disabled}>
                {nullable(value, ({ title }) => (
                    <Text size="s" as="span" className={s.DropdownTriggerValue} title={title}>
                        {title}
                    </Text>
                ))}
            </DropdownTrigger>
            <DropdownPanel
                width={320}
                value={value}
                title={tr('Suggestions')}
                items={items}
                placeholder={placeholder}
                inputState={inputState}
                setInputState={setInputState}
                onChange={onChange}
                renderItem={(props) => (
                    <div className={s.DropdownPanelItem}>
                        <Text size="s" weight="bold" as="span">
                            {props.item.title}
                        </Text>
                        <Text size="s" as="span" className={s.DropdownPanelItem_id}>
                            {props.item.id}
                        </Text>
                    </div>
                )}
            >
                <Button
                    text={tr('Create project')}
                    view="ghost"
                    iconLeft={<IconAddOutline size="s" />}
                    onClick={handleCreateProject}
                    className={s.CreateProjectButton}
                />
            </DropdownPanel>
        </Dropdown>
    );
};
