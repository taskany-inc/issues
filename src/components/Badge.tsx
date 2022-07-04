import styled from 'styled-components';

import { gray7, gray9, radiusL } from '../design/@generated/themes';

export const Badge = styled.div`
    padding: 1px 4px;
    box-sizing: border-box;

    background-color: ${gray7};

    border-radius: ${radiusL};

    color: ${gray9};
    font-size: 12px;
`;
