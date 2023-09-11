import styled from 'styled-components';
import { Text, UserPic, nullable } from '@taskany/bricks';
import { IconXCircleSolid } from '@taskany/icons';
import { gapS, gapXs, gray8, gray9 } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

interface UserBadgeProps {
    user?: ActivityByIdReturnType['user'];
    onCleanButtonClick?: () => void;
}

const StyledUserPick = styled(UserPic)`
    margin-right: ${gapS};
`;

const StyledCleanButton = styled(IconXCircleSolid).attrs({
    size: 'xs',
})`
    color: ${gray8};
    margin-left: ${gapXs};
    visibility: hidden;

    transition: color 100ms ease-in-out;

    &:hover {
        color: ${gray9};
    }
`;

const StyledIssuer = styled.span`
    position: relative;
    display: flex;
    align-items: center;
    margin: ${gapS} 0;
    width: fit-content;

    &:hover {
        ${StyledCleanButton} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

export const UserBadge: React.FC<UserBadgeProps> = ({ user, onCleanButtonClick }) => {
    return (
        <StyledIssuer>
            <StyledUserPick src={user?.image} email={user?.email} size={24} />
            <Text color={gray9} size="s">
                {user?.nickname || user?.name || user?.email}
            </Text>
            {nullable(onCleanButtonClick, (onClick) => (
                <StyledCleanButton onClick={onClick} />
            ))}
        </StyledIssuer>
    );
};
