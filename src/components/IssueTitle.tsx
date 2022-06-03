import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { gray9 } from '../design/@generated/themes';
import { routes } from '../hooks/router';

import { Text } from './Text';
import { Link } from './Link';

interface IssueTitleProps {
    title: string;
    project?: {
        key: string;
        title: string;
    };
}

const StyledIssueTitle = styled.div``;
const StyledIssueProjectTitle = styled.div`
    padding-top: 16px;
`;

export const IssueTitle: React.FC<IssueTitleProps> = ({ title, project }) => {
    const t = useTranslations('IssueTitle');

    return (
        <StyledIssueTitle>
            {project ? (
                <StyledIssueProjectTitle>
                    <Text size="l" weight="bold" color={gray9}>
                        {t('Project')} —{' '}
                        <NextLink passHref href={routes.project(project.key)}>
                            <Link inline>{project.title}</Link>
                        </NextLink>
                    </Text>
                </StyledIssueProjectTitle>
            ) : null}
            <Text size="xxl" weight="bolder">
                {title}
            </Text>
        </StyledIssueTitle>
    );
};
