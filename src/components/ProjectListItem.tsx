import styled from 'styled-components';
import Link from 'next/link';
import { gray4, textColor, gray10, gapM, gapS, gray7 } from '@taskany/colors';
import { Text, UserPic, nullable } from '@taskany/bricks';

import RelativeTime from './RelativeTime/RelativeTime';

interface ProjectListItemProps {
    href: string;
    title: string;
    description?: string | null;
    ownerImage?: string | null;
    onwerEmail?: string;
    createdAt?: Date;
}

const StyledListItem = styled.a`
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
    title,
    description,
    ownerImage,
    onwerEmail,
    createdAt,
    href,
}) => {
    const viewDescription = description?.slice(0, 100);
    const viewDots = description && description.length >= 100;

    return (
        <Link href={href} passHref>
            <StyledListItem>
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

                    {nullable(createdAt, (ca) => (
                        <StyledSubTitle size="s">
                            <RelativeTime date={ca} kind="created" />
                        </StyledSubTitle>
                    ))}
                </StyledName>

                <StyledAddon>
                    <UserPic src={ownerImage} email={onwerEmail} size={24} />
                </StyledAddon>
            </StyledListItem>
        </Link>
    );
};
