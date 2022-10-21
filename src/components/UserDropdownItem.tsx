import styled, { css } from 'styled-components';

import { gray4, gray6, radiusM, textColor } from '../design/@generated/themes';

import { UserPic } from './UserPic';

interface UserDropdownItemProps {
    name?: string;
    email?: string;
    image?: string;
    focused?: boolean;
    checked?: boolean;

    onClick?: () => void;
}

const StyledUserCard = styled.div<Pick<UserDropdownItemProps, 'focused' | 'checked'>>`
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 2fr 10fr;
    justify-content: center;
    align-items: center;
    min-width: 250px;

    padding: 6px;
    margin-bottom: 4px;

    border-radius: ${radiusM};

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            background-color: ${gray6};
        `}

    ${({ checked }) =>
        checked &&
        css`
            background-color: ${gray4};
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
    color: ${textColor};
`;

const StyledUserPick = styled(UserPic)`
    justify-self: center;
`;

export const UserDropdownItem: React.FC<UserDropdownItemProps> = ({
    name,
    email,
    image,
    focused,
    checked,
    onClick,
}) => {
    return (
        <StyledUserCard onClick={onClick} focused={focused} checked={checked}>
            <StyledUserPick src={image} size={24} />

            <StyledUserInfo>
                <StyledUserName>{name}</StyledUserName>
                <StyledUserEmail>{email}</StyledUserEmail>
            </StyledUserInfo>
        </StyledUserCard>
    );
};
