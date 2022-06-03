import styled from 'styled-components';

import { gray9 } from '../design/@generated/themes';

export const Light = styled.span`
    display: inline-block;

    transition: color 200ms cubic-bezier(0.3, 0, 0.5, 1);

    cursor: default;

    &:hover {
        color: ${gray9};
    }
`;
