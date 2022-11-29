import React from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { gapM, gapS, gray9 } from '../design/@generated/themes';
import { routes } from '../hooks/router';

import { Text } from './Text';
import { Link } from './Link';

interface IssueProjectProps {
    project: {
        key: string;
        title: string;
    };
    mode?: 'compact' | 'default';
    as?: React.ComponentProps<typeof Text>['as'];
    size?: React.ComponentProps<typeof Text>['size'];
}

const sizeGapMap = {
    xxs: gapS,
    xs: gapS,
    s: gapS,
    m: gapS,
    l: gapM,
    xl: gapM,
    xxl: gapM,
};

const StyledIssueProjectTitle = styled(Text)`
    display: inline-block;
    padding-top: ${({ size = 'l' }) => sizeGapMap[size]};
`;

export const IssueProject: React.FC<IssueProjectProps> = ({ project, as, mode, size = 'l' }) => {
    const t = useTranslations('IssueTitle');

    const pre = mode === 'compact' ? '' : `${t('Project')} — `;

    return (
        <StyledIssueProjectTitle as={as} size={size} weight="bold" color={gray9}>
            {pre}
            <NextLink passHref href={routes.project(project.key)}>
                <Link inline>{project.title}</Link>
            </NextLink>
        </StyledIssueProjectTitle>
    );
};
