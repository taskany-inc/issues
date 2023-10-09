import styled from 'styled-components';
import { gray8, gray9 } from '@taskany/colors';
import { IconXCircleSolid } from '@taskany/icons';

export const BadgeCleanButton = styled(IconXCircleSolid).attrs({
    size: 'xs',
})`
    color: ${gray8};
    visibility: hidden;

    transition: color 100ms ease-in-out;

    &:hover {
        color: ${gray9};
    }
`;
