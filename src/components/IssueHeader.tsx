import React from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { routes } from '../hooks/router';
import { textColorSecondary } from '../design/@generated/themes';
import { Link } from './Link';

interface IssueHeaderProps {
    issue: {
        id: string;
        title: string;
        project?: {
            id: string | number;
            slug?: string;
            title: string;
            description?: string;
        };
    };
    extras?: React.ReactNode;
}

const StyledIssueHeader = styled.div``;
const StyledIssueHeaderId = styled.div`
    color: ${textColorSecondary};
    font-weight: 500;
    padding-bottom: 10px;
`;
const StyledIssueHeaderProjectTitle = styled.div`
    font-weight: 600;
`;
const StyledIssueHeaderTitle = styled.div`
    font-size: 3rem;
    font-weight: 700;
    line-height: 1.2;
`;
const StyledIssueHeaderExtras = styled.div`
    padding-top: 10px;
`;

export const IssueHeader: React.FC<IssueHeaderProps> = ({ issue, extras }) => {
    const t = useTranslations('IssueHeader');

    return (
        <StyledIssueHeader>
            <StyledIssueHeaderId>#{issue.id}</StyledIssueHeaderId>
            {issue.project && issue.project.slug && (
                <StyledIssueHeaderProjectTitle>
                    {t('Project')} —{' '}
                    <NextLink href={routes.project(issue.project.slug)} passHref>
                        <Link inline title={issue.project.description}>
                            {issue.project.title}
                        </Link>
                    </NextLink>
                </StyledIssueHeaderProjectTitle>
            )}
            <StyledIssueHeaderTitle>{issue.title}</StyledIssueHeaderTitle>

            {extras && <StyledIssueHeaderExtras>{extras}</StyledIssueHeaderExtras>}
        </StyledIssueHeader>
    );
};
