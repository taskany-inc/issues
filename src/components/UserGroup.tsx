import { FC } from 'react';
import styled from 'styled-components';
import { UserPic } from '@taskany/bricks';
import { gapSm, gray4 } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

const UserGroupContainer = styled.div`
    display: inline-flex;
`;

const UserContainer = styled.div`
    border-radius: 100%;
    border: 1px solid ${gray4};

    & + & {
        margin-left: calc(${gapSm} * -1);
    }
`;

const UserImage = styled(UserPic)`
    display: block;
`;

export const UserGroup: FC<{
    users: NonNullable<ActivityByIdReturnType>[];
    className?: string;
    size?: number;
}> = ({ users, className, size = 24 }) => {
    return (
        <UserGroupContainer className={className}>
            {users.map(({ user, ghost }, i) => (
                <UserContainer key={i}>
                    <UserImage src={user?.image} email={user?.email || ghost?.email} size={size} />
                </UserContainer>
            ))}
        </UserGroupContainer>
    );
};
