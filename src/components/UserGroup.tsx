import { ComponentProps, useMemo } from 'react';
import { UserGroup as UserGroupBricks } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

interface UserGroupProps extends ComponentProps<typeof UserGroupBricks> {
    users: NonNullable<ActivityByIdReturnType>[];
}

export const UserGroup = ({ users, ...rest }: UserGroupProps) => {
    const extractedUsers = useMemo(() => users.map((a) => a.user || a.ghost).filter(Boolean) ?? [], [users]);
    return <UserGroupBricks users={extractedUsers} {...rest} />;
};
