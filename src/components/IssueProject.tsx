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
    padding-top: ${({ size = 'l' }) => sizeGapMap[size]};
`;

export const IssueProject: React.FC<IssueProjectProps> = ({ project, size = 'l' }) => {
    const t = useTranslations('IssueTitle');

    return (
        <StyledIssueProjectTitle size={size} weight="bold" color={gray9}>
            {t('Project')} —{' '}
            <NextLink passHref href={routes.project(project.key)}>
                <Link inline>{project.title}</Link>
            </NextLink>
        </StyledIssueProjectTitle>
    );
};
