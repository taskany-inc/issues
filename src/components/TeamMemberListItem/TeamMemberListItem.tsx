import { FC } from 'react';
import { CircleProgressBar, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { CrewUserRole } from '../../utils/db/types';
import { UserBadge } from '../UserBadge/UserBadge';
import { TableListItem, TableListItemElement } from '../TableListItem/TableListItem';

import s from './TeamMemberListItem.module.css';

interface TeamMemberListItemProps {
    email: string;
    image?: string;
    name?: string;
    percentage?: number;
    roles: CrewUserRole[];
}

export const TeamMemberListItem: FC<TeamMemberListItemProps> = ({ email, image, name, percentage, roles }) => {
    return (
        <TableListItem>
            <TableListItemElement className={s.TeamMemberListItemUser}>
                <UserBadge image={image} name={name ?? email} email={email} />
            </TableListItemElement>
            <TableListItemElement>
                <Text size="xs">{roles.map((role) => role.name).join(', ')}</Text>
            </TableListItemElement>
            <TableListItemElement width={30}>
                {nullable(percentage, (p) => (
                    <CircleProgressBar value={p} />
                ))}
            </TableListItemElement>
        </TableListItem>
    );
};
