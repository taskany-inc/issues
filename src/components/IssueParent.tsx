import React from 'react';
import styled, { css } from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { gapM, gapS, gray9 } from '@taskany/colors';
import { Text, Link } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { nullable } from '../utils/nullable';

interface Parent {
    id?: string;
    title: string;
}

interface IssueParentProps {
    kind: 'project' | 'team';
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

export const IssueParent: React.FC<IssueParentProps> = ({ parent, kind, as, mode = 'default', size = 'l' }) => {
    const t = useTranslations('IssueTitle');
    const normalizedParent = ([] as Array<Parent | undefined>).concat(parent).filter(Boolean) as Array<Parent>;

    const kindTitleMap = {
        project: `${t('Project')}: `,
        team: `${t('Team')}: `,
    };

    const kindContentMap = {
        project: normalizedParent.map((p, i) =>
            nullable(p.id, (key) => (
                <span key={key}>
                    <NextLink passHref href={routes.project(key)}>
                        <Link inline>{p.title}</Link>
                    </NextLink>
                    {i < normalizedParent.length - 1 ? ', ' : ''}
                </span>
            )),
        ),
        team: normalizedParent.map((t, i) =>
            nullable(t.id, (key) => (
                <span key={key}>
                    <NextLink passHref href={routes.team(key)}>
                        <Link inline>{t.title}</Link>
                    </NextLink>
                    {i < normalizedParent.length - 1 ? ', ' : ''}
                </span>
            )),
        ),
    };

    const pre = mode === 'compact' ? '' : `${kindTitleMap[kind]}`;

    return (
        <StyledIssueParentTitle as={as} size={size} weight="bold" color={gray9} mode={mode}>
            {pre}
            {kindContentMap[kind]}
        </StyledIssueParentTitle>
    );
};
