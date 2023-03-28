import styled from 'styled-components';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { routes } from '../hooks/router';
import type { Project } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10, gapM, gapS, gray7 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Text } from './Text';
import { UserPic } from './UserPic';

const RelativeTime = dynamic(() => import('./RelativeTime'));

interface ProjectListItemProps {
    project: Project;
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
    project: { key, title, description, activity, createdAt },
}) => {
    const viewDescription = description?.slice(0, 100);
    const viewDots = description && description.length >= 100;

    return (
        <Link href={routes.project(key)} passHref>
            <StyledProjectListItem>
                <StyledName>
                    <Text size="m" weight="bold">
                        {title}
                    </Text>

                    {nullable(viewDescription, (d) => (
                        <StyledDescription size="s" color={gray7} title={viewDots ? description : undefined}>
                            {d}
                            {viewDots ? '...' : ''}
                        </StyledDescription>
                    ))}

                    <StyledSubTitle size="s">
                        <RelativeTime date={createdAt} kind="created" />
                    </StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    <UserPic
                        src={activity?.user?.image}
                        email={activity?.user?.email || activity?.ghost?.email}
                        size={24}
                    />
                </StyledAddon>
            </StyledProjectListItem>
        </Link>
    );
};
