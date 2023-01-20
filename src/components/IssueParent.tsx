import React from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { gapM, gapS, gray9 } from '../design/@generated/themes';
import { routes } from '../hooks/router';
import { nullable } from '../utils/nullable';

import { Text } from './Text';
import { Link } from './Link';

interface IssueParentProps {
    kind: 'project' | 'team';
    parent: {
        key?: string;
        slug?: string;
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

const StyledIssueParentTitle = styled(Text)`
    display: inline-block;
    padding-top: ${({ size = 'l' }) => sizeGapMap[size]};
`;

export const IssueParent: React.FC<IssueParentProps> = ({ parent, kind, as, mode, size = 'l' }) => {
    const t = useTranslations('IssueTitle');

    const kindTitleMap = {
        project: t('Project'),
        team: t('Team'),
    };

    const kindContentMap = {
        project: nullable(parent.key, (key) => (
            <NextLink passHref href={routes.project(key)}>
                <Link inline>{parent.title}</Link>
            </NextLink>
        )),
        team: nullable(parent.slug, (slug) => (
            <NextLink passHref href={routes.team(slug)}>
                <Link inline>{parent.title}</Link>
            </NextLink>
        )),
    };

    const pre = mode === 'compact' ? '' : `${kindTitleMap[kind]} — `;

    return (
        <StyledIssueParentTitle as={as} size={size} weight="bold" color={gray9}>
            {pre}
            {kindContentMap[kind]}
        </StyledIssueParentTitle>
    );
};
