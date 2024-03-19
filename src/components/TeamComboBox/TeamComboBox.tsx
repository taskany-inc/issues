import React, { useCallback, useState, FC, MutableRefObject } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconPlusCircleOutline } from '@taskany/icons';

import { trpc } from '../../utils/trpcClient';
import { useProjectResource } from '../../hooks/useProjectResource';
import { ProjectByIdReturnType, TeamSuggetionsReturnType } from '../../../trpc/inferredTypes';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

interface TeamComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    placeholder?: string;
    disabled?: boolean;
    project: NonNullable<ProjectByIdReturnType>;
}

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

    return (
        <Dropdown {...attrs}>
            <DropdownTrigger
                renderTrigger={({ onClick, ref }) => (
                    <Button
                        view="ghost"
                        text={text}
                        disabled={disabled}
                        ref={ref as MutableRefObject<HTMLButtonElement>}
                        iconLeft={<IconPlusCircleOutline size="s" />}
                        onClick={(e) => {
                            e.preventDefault();
                            onClick?.();
                        }}
                    />
                )}
            />
            <DropdownPanel
                placement="bottom-start"
                setInputState={setSearch}
                mode="single"
                onChange={onChange}
                inputState={search}
                items={data}
                renderItem={(props) => props.item.name}
                placeholder={placeholder}
            />
        </Dropdown>
    );
};
