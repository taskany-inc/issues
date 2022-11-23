import styled from 'styled-components';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { routes } from '../hooks/router';
import type { Scalars, Activity } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10, gapM, gapS, gray7 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';
import { TLocale } from '../types/locale';

import { Text } from './Text';
import { UserPic } from './UserPic';

const RelativeTime = dynamic(() => import('./RelativeTime'));

interface ProjectListItemProps {
    projectKey: string;
    title: string;
    createdAt: Scalars['DateTime'];
    locale: TLocale;
    description?: string;
    owner?: Activity;
}

const StyledProjectListItem = styled.a`
    display: grid;
    grid-template-columns: 500px 40px;
    align-items: center;

    color: ${textColor};
    text-decoration: none;

    transition: background-color 150ms ease-in;

    &:hover {
        background-color: ${gray4};
    }

    &:visited {
        color: ${textColor};
    }

    padding: ${gapM} 40px;
    margin: 0 -40px;
`;

const StyledName = styled.div`
    width: 800px;
    max-width: 100%;
`;

const StyledTitle = styled(Text)``;

const StyledDescription = styled(Text)`
    margin-top: ${gapS};
`;

const StyledAddon = styled.div`
    justify-self: center;
    align-self: center;
    vertical-align: middle;
`;

const StyledSubTitle = styled(Text)`
    color: ${gray10};
    width: 100%;
    padding-top: ${gapS};
`;

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    projectKey,
    title,
    description,
    owner,
    createdAt,
    locale,
}) => {
    return (
        <Link href={routes.project(projectKey)} passHref>
            <StyledProjectListItem>
                <StyledName>
                    <StyledTitle size="m" weight="bold">
                        {title}
                    </StyledTitle>

                    {nullable(description, (d) => (
                        <StyledDescription size="s" color={gray7}>
                            {d}
                        </StyledDescription>
                    ))}

                    <StyledSubTitle size="s">
                        <RelativeTime locale={locale} date={createdAt} kind="created" />
                    </StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    <UserPic src={owner?.user?.image} email={owner?.user?.email || owner?.ghost?.email} size={24} />
                </StyledAddon>
            </StyledProjectListItem>
        </Link>
    );
};
