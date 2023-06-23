import styled from 'styled-components';
import { CleanButton, Text, UserPic, nullable } from '@taskany/bricks';
import { gapS, gray9 } from '@taskany/colors';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

interface UserBadgeProps {
    user?: ActivityByIdReturnType['user'];
    onCleanButtonClick?: () => void;
}

const StyledUserPick = styled(UserPic)`
    margin-right: ${gapS};
`;

const StyledCleanButton = styled(CleanButton)`
    top: unset;
`;

const StyledIssuer = styled.span`
    position: relative;
    display: flex;
    align-items: center;
    margin: ${gapS} 0;
    padding-right: var(--gap-m); // clean button place
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
                {user?.nickname || user?.name}
            </Text>
            {nullable(onCleanButtonClick, (onClick) => (
                <StyledCleanButton onClick={onClick} />
            ))}
        </StyledIssuer>
    );
};
