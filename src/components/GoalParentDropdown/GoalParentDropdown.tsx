import { Text, Button, Counter } from '@taskany/bricks/harmony';
import { useState, useEffect, useMemo, ComponentProps, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { IconAddOutline } from '@taskany/icons';

import { useLocalStorage } from '../../hooks/useLocalStorage';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import s from './GoalParentDropdown.module.css';
import { tr } from './GoalParentDropdown.i18n';

interface GoalParentValue {
    id: string;
    title: string;
}

type GoalParentDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    value?: GoalParentValue | GoalParentValue[];
    query?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    onClose?: () => void;
} & DropdownGuardedProps<GoalParentValue>;

export const GoalParentDropdown = ({
    query = '',
    value,
    placeholder,
    mode,
    placement,
    onChange,
    onClose,
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

    const suggestions = useMemo<typeof recentProjects | typeof data>(
        () => (data && data?.length > 0 ? data : recentProjects),
        [data, recentProjects],
    );

    const values = useMemo(() => {
        const res: GoalParentValue[] = [];
        return res.concat(value || []);
    }, [value]);

    const valuesMap = useMemo(() => {
        return values.reduce<Record<string, boolean>>((acc, cur) => {
            acc[cur.id] = true;
            return acc;
        }, {});
    }, [values]);

    const items = useMemo(() => {
        if (mode === 'single') {
            return suggestions;
        }

        return suggestions?.filter((suggest) => valuesMap[suggest.id]);
    }, [mode, suggestions, valuesMap]);

    const handleCreateProject = useCallback(() => {
        dispatchModalEvent(ModalEvent.GoalCreateModal)();
        dispatchModalEvent(ModalEvent.ProjectCreateModal)();
    }, []);

    const handleClose = useCallback(() => {
        onClose?.();
        setInputState('');
    }, [onClose]);

    return (
        <Dropdown arrow onClose={handleClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && values.length > 1,
                    () => (
                        <Counter count={values.length} />
                    ),
                    nullable(values, ([{ title }]) => (
                        <Text size="s" ellipsis className={s.DropdownTriggerValue} title={title}>
                            {title}
                        </Text>
                    )),
                )}
            </DropdownTrigger>
            <DropdownPanel
                width={320}
                value={values}
                title={tr('Suggestions')}
                items={items}
                placement={placement}
                mode={mode}
                selectable
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
