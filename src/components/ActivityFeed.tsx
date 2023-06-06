import styled from 'styled-components';
import { gapL, gapM, gray5 } from '@taskany/colors';

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
    position: relative;

    :first-child::before {
        content: '';
        position: absolute;
        height: ${gapL};
        left: 15px;
        top: 0;
        border-left: 1px solid ${gray5};
        z-index: -1;
        transform: translateY(-100%);
    }

    ::after {
        content: '';
        position: absolute;
        height: calc(100% + ${gapM});
        left: 15px;
        border-left: 1px solid ${gray5};
        z-index: -1;
    }

    :last-child::after {
        content: none;
    }
`;
