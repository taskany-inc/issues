import React from 'react';
import styled, { css } from 'styled-components';
import { gapM, gapS, gray9 } from '@taskany/colors';
import { Text, Link, nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { goalPageHeaderParent } from '../utils/domObjects';

import { NextLink } from './NextLink';

interface Parent {
    id?: string;
    title: string;
}

interface IssueParentProps {
    parent: Array<Parent | undefined> | Parent;
    mode?: 'compact' | 'default';
    as?: React.ComponentProps<typeof Text>['as'];
    size?: React.ComponentProps<typeof Text>['size'];
}

const sizeGapMap = {
    xxs: gapS,
    xs: gapS,
    s: gapS,
    m: gapS,
    l: gapS,
    xl: gapM,
    xxl: gapM,
};

const StyledIssueParentTitle = styled(Text)<{ mode: IssueParentProps['mode'] }>`
    ${({ mode }) =>
        mode === 'compact' &&
        css`
            display: inline-block;
        `}

    padding-top: ${({ size = 'm' }) => sizeGapMap[size]};
`;

export const IssueParent: React.FC<IssueParentProps> = ({ parent, as, mode = 'default', size = 'l' }) => {
    const normalizedParent = ([] as Array<Parent | undefined>).concat(parent).filter(Boolean) as Array<Parent>;

    return (
        <StyledIssueParentTitle as={as} size={size} weight="bold" color={gray9} mode={mode}>
            {normalizedParent.map((p, i) =>
                nullable(p.id, (id) => (
                    <span key={id} {...goalPageHeaderParent.attr}>
                        <Link as={NextLink} href={routes.project(id)} inline>
                            {p.title}
                        </Link>
                        {i < normalizedParent.length - 1 ? ', ' : ''}
                    </span>
                )),
            )}
        </StyledIssueParentTitle>
    );
};
