import { FC, useMemo } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';
import { UserPic, Text } from '@taskany/bricks';
import { gapSm, gray4, gray9, gray6, radiusL, radiusXl } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

const Popup = dynamic(() => import('@taskany/bricks/components/Popup'));

const hoverCss = css`
    z-index: 1;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.08));
`;

const UserGroupContainer = styled.div`
    display: inline-flex;
`;

const UserContainer = styled.div`
    border-radius: 100%;
    border: 1px solid ${gray4};

    & + & {
        margin-left: calc(${gapSm} * -1);
    }

    &:hover {
        ${hoverCss};
    }
`;

const UserImage = styled(UserPic)`
    display: block;
`;

const StyledCounter = styled.div`
    min-width: 0.75rem;
    padding: 0px 5px;
    margin: 2px 0px;
    border-radius: ${radiusL};
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${gray4};
    position: relative;
    right: 10px;

    &:hover {
        ${hoverCss};
    }
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
    const items = users.slice(0, showCounter ? limit : users.length);

    const counterUsersList = useMemo(() => {
        return users.reduce((acc, { user }, index) => {
            if (index < limit || !user?.name) return acc;

            acc += acc ? `, ${user.name}` : user.name;
            return acc;
        }, '');
    }, [limit, users]);

    return (
        <UserGroupContainer className={className}>
            {items.map(({ user, ghost }, i) => (
                <Popup
                    key={i}
                    target={
                        <UserContainer>
                            <UserImage src={user?.image} email={user?.email || ghost?.email} size={size} />
                        </UserContainer>
                    }
                    tooltip
                    placement="top"
                >
                    {user?.name}
                </Popup>
            ))}
            {showCounter && (
                <>
                    <Popup
                        target={
                            <StyledCounter>
                                <Text color={gray9} size="xs">
                                    {users.length - limit}
                                </Text>
                            </StyledCounter>
                        }
                        tooltip
                        maxWidth={420}
                        placement="top"
                    >
                        {counterUsersList}
                    </Popup>
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
