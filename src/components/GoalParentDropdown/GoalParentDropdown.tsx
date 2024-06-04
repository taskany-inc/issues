import { Text, Button, Counter } from '@taskany/bricks/harmony';
import { useState, useEffect, useMemo, ComponentProps, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { IconAddOutline } from '@taskany/icons';

import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { ModalContext } from '../ModalOnEvent';

import s from './GoalParentDropdown.module.css';
import { tr } from './GoalParentDropdown.i18n';

interface GoalParentValue {
    id: string;
    title: string;
}

type GoalParentDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    renderTrigger?: ComponentProps<typeof DropdownTrigger>['renderTrigger'];
    value?: GoalParentValue | GoalParentValue[];
    query?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    filter?: string[];
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    onClose?: () => void;
    onNewProjectClick?: () => void;
} & DropdownGuardedProps<GoalParentValue>;

export const GoalParentDropdown = ({
    query = '',
    value,
    placeholder,
    mode,
    placement,
    onChange,
    onClose,
    filter,
    onNewProjectClick,
    ...props
}: GoalParentDropdownProps) => {
    const { values, filterIds } = useMemo(() => {
        const res: GoalParentValue[] = [];
        const values = res.concat(value || []);

        const filterIds = Array.from(
            values.reduce((acum, { id }) => {
                acum.add(id);

                return acum;
            }, new Set<string>(filter)),
        );

        return {
            values,
            filterIds,
        };
    }, [value, filter]);

    const [inputState, setInputState] = useState(query);

    const enableSuggestion = inputState.length >= 2;

    const { data: userProjects = [] } = trpc.v2.project.userProjects.useQuery(
        {
            take: 10,
            filter: filterIds,
        },
        {
            keepPreviousData: true,
        },
    );

    const { data: suggestionsProjects = [] } = trpc.project.suggestions.useQuery(
        {
            query: inputState,
            filter: filterIds,
        },
        {
            enabled: enableSuggestion,
            keepPreviousData: true,
            cacheTime: 0,
            staleTime: 0,
        },
    );

    useEffect(() => {
        setInputState(query);
    }, [query]);

    const handleCreateProject = useCallback(() => {
        onNewProjectClick?.();
        dispatchModalEvent(ModalEvent.ProjectCreateModal)();
    }, [onNewProjectClick]);

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
                items={enableSuggestion ? suggestionsProjects : userProjects}
                placement={placement}
                mode={mode}
                selectable
                placeholder={placeholder}
                inputState={inputState}
                setInputState={setInputState}
                onChange={onChange}
                renderItem={(props) => (
                    <div className={s.DropdownPanelItem}>
                        <Text size="s" weight="bold" as="span" ellipsis>
                            {props.item.title}
                        </Text>
                        <Text size="s" as="span" className={s.DropdownPanelItem_id}>
                            {props.item.id}
                        </Text>
                    </div>
                )}
            >
                <ModalContext.Consumer>
                    {(ctx) =>
                        nullable(!ctx[ModalEvent.ProjectCreateModal], () => (
                            <Button
                                text={tr('Create project')}
                                view="ghost"
                                iconLeft={<IconAddOutline size="s" />}
                                onClick={handleCreateProject}
                                className={s.CreateProjectButton}
                            />
                        ))
                    }
                </ModalContext.Consumer>
            </DropdownPanel>
        </Dropdown>
    );
};
