import { ComponentProps, useMemo } from 'react';
import { UserGroup as UserGroupBricks } from '@taskany/bricks';

import { getUserName, prepareUserDataFromActivity } from '../utils/getUserName';

type User = ComponentProps<typeof UserGroupBricks>['users'][number];

interface UserGroupProps extends ComponentProps<typeof UserGroupBricks> {
    users: Array<{
        user?: User | null;
        ghost?: User | null;
    }>;
}

export const UserGroup = ({ users, ...rest }: UserGroupProps) => {
    const extractedUsers = useMemo(
        () =>
            users.reduce<User>((acc, activity) => {
                const target = prepareUserDataFromActivity(activity);

                if (target != null) {
                    acc.push({
                        email: target.email,
                        name: getUserName(target),
                        image: target.image,
                    });
                }

                return acc;
            }, []),
        [users],
    );
    return <UserGroupBricks users={extractedUsers} {...rest} />;
};
