import styled from 'styled-components';

export const ActivityFeed = styled.div`
    display: grid;
    row-gap: var(--gap-m);
    padding-bottom: 250px;
    position: relative;
`;

export const ActivityFeedItem = styled.div`
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    column-gap: var(--gap-m);
    position: relative;

    :first-child {
        padding-top: 20px;
    }

    :first-child::before {
        content: '';
        position: absolute;
        height: var(--gap-l);
        left: 15px;
        top: 0;
        border-left: 1px solid var(--gray5);
        z-index: 0;
        transform: translateY(-100%);
    }

    ::after {
        content: '';
        position: absolute;
        height: calc(100% + var(--gap-m));
        left: 15px;
        border-left: 1px solid var(--gray5);
        z-index: 0;
    }

    :last-child::after {
        content: none;
    }

    &:first-child::before {
        content: none;
    }
`;
