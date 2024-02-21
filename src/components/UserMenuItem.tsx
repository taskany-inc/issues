import styled from 'styled-components';
import { UserPic } from '@taskany/bricks';

interface UserMenuItemProps {
    name?: string;
    email?: string;
    image?: string;
    focused?: boolean;
    checked?: boolean;

    onClick?: () => void;
}

const StyledUserCard = styled.div<Pick<UserMenuItemProps, 'focused' | 'checked'>>`
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 2fr 10fr;
    justify-content: center;
    align-items: center;
    min-width: 250px;

    padding: 6px;
    margin-bottom: 4px;

    border-radius: var(--radius-m);

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: var(--gray4);
    }

    ${({ focused }) =>
        focused &&
        `
            background-color: var(--gray6);
        `}

    ${({ checked }) =>
        checked &&
        `
            background-color: var(--gray4);
        `}
`;

const StyledUserInfo = styled.div`
    padding-left: 4px;
`;

const StyledUserName = styled.div`
    font-size: 14px;
    font-weight: 600;
`;

const StyledUserEmail = styled.div`
    font-size: 12px;
    color: var(--text-color);
`;

const StyledUserPick = styled(UserPic)`
    justify-self: center;
`;

export const UserMenuItem: React.FC<UserMenuItemProps> = ({ name, email, image, focused, checked, onClick }) => (
    <StyledUserCard onClick={onClick} focused={focused} checked={checked}>
        <StyledUserPick src={image} email={email} size={24} />

        <StyledUserInfo>
            <StyledUserName>{name}</StyledUserName>
            <StyledUserEmail>{email}</StyledUserEmail>
        </StyledUserInfo>
    </StyledUserCard>
);
