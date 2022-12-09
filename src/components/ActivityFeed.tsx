import styled from 'styled-components';

import { gapL, gapM } from '../design/@generated/themes';

export const ActivityFeed = styled.div`
    display: grid;
    padding-top: ${gapL};
    row-gap: ${gapM};
`;

export const ActivityFeedItem = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;
