import React from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { gapS, gapXs, gray8, gray9 } from '@taskany/colors';
import { IconUsersOutline } from '@taskany/icons';
import { Link, Text, nullable } from '@taskany/bricks';

interface ProjectBadgeProps {
    title: string;
    children?: React.ReactNode;
    className?: string;
}

const StyledProjectBadgeIconContainer = styled.span`
    display: flex;
    align-items: center;
    visibility: hidden;

    color: ${gray8};

    &:hover {
        color: ${gray9};
    }
`;

const StyledProjectBadge = styled.div`
    position: relative;
    display: flex;
    align-items: center;

    padding: ${gapXs} 0;

    width: fit-content;

    &:hover {
        ${StyledProjectBadgeIconContainer} {
            visibility: visible;

            cursor: pointer;
        }
    }
`;

const StyledText = styled(Text).attrs({
    color: gray9,
    size: 's',
    ellipsis: true,
})`
    padding: 0 ${gapXs} 0 ${gapS};
`;

export const ProjectBadge: React.FC<ProjectBadgeProps> = ({ title, children, className }) => {
    return (
        <StyledProjectBadge className={className}>
            <IconUsersOutline size="s" />

            <StyledText>
                <Link as={NextLink} href="/" inline>
                    {title}
                </Link>
            </StyledText>

            {nullable(children, (ch) => (
                <StyledProjectBadgeIconContainer>{ch}</StyledProjectBadgeIconContainer>
            ))}
        </StyledProjectBadge>
    );
};
