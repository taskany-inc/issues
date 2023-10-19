import styled from 'styled-components';

export const Light = styled.span`
    display: inline-block;
    transition: color 200ms cubic-bezier(0.3, 0, 0.5, 1);

    &:hover {
        cursor: pointer;
        color: ${({ color = 'inherit' }) => color};
    }
`;
