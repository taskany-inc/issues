import React, { useCallback, useState, ChangeEvent, FC, ComponentProps, useRef, useEffect } from 'react';
import {
    Input,
    Button,
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    DropdownContext,
    MenuItem,
} from '@taskany/bricks/harmony';
import { IconPlusCircleOutline } from '@taskany/icons';
import { ListView, ListViewItem, nullable } from '@taskany/bricks';

import { trpc } from '../../utils/trpcClient';
import { useProjectResource } from '../../hooks/useProjectResource';
import { ProjectByIdReturnType, TeamSuggetionsReturnType } from '../../../trpc/inferredTypes';

import s from './TeamComboBox.module.css';

interface TeamComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    placeholder?: string;
    disabled?: boolean;
    project: NonNullable<ProjectByIdReturnType>;
}

const TeamComboBoxInput: FC<ComponentProps<typeof Input>> = ({ autoFocus, ...attr }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    return <Input ref={inputRef} {...attr} />;
};

export const TeamComboBox: FC<TeamComboBoxProps & React.HTMLAttributes<HTMLDivElement>> = ({
    text,
    project,
    disabled,
    placeholder,
    ...attrs
}) => {
    const { updateProjectTeams } = useProjectResource(project.id);

    const [search, setSearch] = useState('');

    const { data = [] } = trpc.crew.teamSuggetions.useQuery(
        {
            search,
            take: 3,
        },
        {
            enabled: search.length >= 1,
        },
    );

    const onChange = useCallback(
        (item: TeamSuggetionsReturnType) => {
            setSearch('');

            if (item) {
                updateProjectTeams({
                    id: project.id,
                    teams: [...project.teams.map(({ externalTeamId }) => externalTeamId), item.id],
                });
            }
        },
        [updateProjectTeams, project],
    );

    const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.currentTarget.value);
    }, []);

    return (
        <Dropdown {...attrs}>
            <DropdownTrigger
                renderTrigger={({ onClick, ref }) => (
                    <Button
                        view="ghost"
                        text={text}
                        disabled={disabled}
                        ref={ref}
                        iconLeft={<IconPlusCircleOutline size="s" />}
                        onClick={(e) => {
                            e.preventDefault();
                            onClick?.();
                        }}
                    />
                )}
            />
            <DropdownContext.Consumer>
                {({ toggle, isOpen }) => (
                    <DropdownPanel placement="bottom-start" arrow>
                        {nullable(isOpen, () => (
                            <ListView onKeyboardClick={onChange}>
                                <TeamComboBoxInput
                                    outline
                                    className={s.TeamComboBoxSearch}
                                    autoFocus={isOpen}
                                    disabled={disabled}
                                    placeholder={placeholder}
                                    onChange={onSearchChange}
                                    value={search}
                                />
                                {nullable(data, () => (
                                    <div className={s.TeamComboBoxList}>
                                        {data.map((item) => (
                                            <ListViewItem
                                                key={item.id}
                                                value={item}
                                                renderItem={({ active, ...props }) => (
                                                    <MenuItem
                                                        onClick={() => {
                                                            onChange(item);
                                                            toggle();
                                                        }}
                                                        selected={active}
                                                        {...props}
                                                    >
                                                        {item.name}
                                                    </MenuItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </ListView>
                        ))}
                    </DropdownPanel>
                )}
            </DropdownContext.Consumer>
        </Dropdown>
    );
};
