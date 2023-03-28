import styled from 'styled-components';
import Link from 'next/link';

import { nullable } from '@common/utils/nullable';
import { Text } from '@common/Text';
import { UserPic } from '@common/UserPic';

import { routes } from '../hooks/router';
import type { Team } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10, gapM, gapS, gray7 } from '../design/@generated/themes';

interface TeamListItemProps {
    team: Team;
}

const StyledTeamListItem = styled.a`
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

export const TeamListItem: React.FC<TeamListItemProps> = ({ team: { key, title, description, activity } }) => {
    return (
        <Link href={routes.team(key)} passHref>
            <StyledTeamListItem>
                <StyledName>
                    <Text size="m" weight="bold">
                        {title}
                    </Text>

                    {nullable(description, (d) => (
                        <StyledDescription size="s" color={gray7}>
                            {d}
                        </StyledDescription>
                    ))}

                    <StyledSubTitle size="s"></StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    <UserPic
                        src={activity?.user?.image}
                        email={activity?.user?.email || activity?.ghost?.email}
                        size={24}
                    />
                </StyledAddon>
            </StyledTeamListItem>
        </Link>
    );
};
