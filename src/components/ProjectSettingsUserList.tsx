import { Text } from '@taskany/bricks';
import styled from 'styled-components';
import { gapM, gapS, gray3, gray9 } from '@taskany/colors';
import { ComponentProps } from 'react';

import { SettingsCard } from './SettingsContent';
import { UserEditableList } from './UserEditableList/UserEditableList';

const StyledTitle = styled(Text)`
    padding: ${gapS} ${gapM} ${gapM};
`;

const StyledListContainer = styled.div`
    background-color: ${gray3};
    padding: ${gapS} ${gapM};
`;

interface ProjectSettingsUserListProps extends ComponentProps<typeof UserEditableList> {
    title: string;
}

export const ProjectSettingsUserList = ({
    title,
    users,
    onAdd,
    onRemove,
    triggerText,
    editable = true,
    filterIds,
    ...attrs
}: ProjectSettingsUserListProps) => {
    return (
        <SettingsCard {...attrs}>
            <StyledTitle size="m" weight="bold" color={gray9}>
                {title}
            </StyledTitle>
            <StyledListContainer>
                <UserEditableList
                    users={users}
                    filterIds={filterIds}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    triggerText={triggerText}
                    editable={editable}
                />
            </StyledListContainer>
        </SettingsCard>
    );
};
