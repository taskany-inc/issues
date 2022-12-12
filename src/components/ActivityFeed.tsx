import styled from 'styled-components';

import { gapL, gapM } from '../design/@generated/themes';

export const ActivityFeed = styled.div`
    display: grid;
    row-gap: ${gapM};
    padding-top: ${gapL};
    padding-bottom: 250px;
`;

export const ActivityFeedItem = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;
