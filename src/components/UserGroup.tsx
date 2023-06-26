import { FC } from 'react';
import styled from 'styled-components';
import { UserPic, Text } from '@taskany/bricks';
import { gapSm, gray4, gray9, gray6, radiusL, radiusXl } from '@taskany/colors';

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

const StyledCounter = styled.div`
    padding: 0px 5px;
    margin: 2px 0px;
    border-radius: ${radiusL};
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${gray4};
    position: relative;
    right: 10px;
`;
const StyledSmallCircle = styled.div`
    width: 0.7rem;
    height: 0.7rem;
    border-radius: ${radiusXl};
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${gray6};
    position: relative;
    right: 15px;
    transform: translateY(8px);
`;

export const UserGroup: FC<{
    users: NonNullable<ActivityByIdReturnType>[];
    className?: string;
    size?: number;
    limit?: number;
}> = ({ users, className, size = 24, limit = 3 }) => {
    const showCounter = users.length > limit;
    const items = [...users];
    if (showCounter) items.length = 3;

    return (
        <UserGroupContainer className={className}>
            {items.map(({ user, ghost }, i) => (
                <UserContainer key={i}>
                    <UserImage src={user?.image} email={user?.email || ghost?.email} size={size} />
                </UserContainer>
            ))}
            {showCounter && (
                <>
                    <StyledCounter>
                        <Text color={gray9} size="xs">
                            {users.length - limit}
                        </Text>
                    </StyledCounter>
                    <StyledSmallCircle>
                        <Text color={gray9} size="xxs" as="span">
                            +
                        </Text>
                    </StyledSmallCircle>
                </>
            )}
        </UserGroupContainer>
    );
};
