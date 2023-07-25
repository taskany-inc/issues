import React, { MouseEventHandler } from 'react';
import NextLink from 'next/link';
import { ProjectIcon } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { UserGroup } from './UserGroup';
import { TableRow, ContentItem, TitleItem, TitleContainer, Title, TextItem } from './Table';

interface ProjectListItemCompactProps {
    id: string;
    title: string;
    owner?: ActivityByIdReturnType;
    focused?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export const ProjectListItemCompact: React.FC<ProjectListItemCompactProps> = React.memo(
    ({ id, owner, title, focused, className, onClick }) => {
        return (
            <NextLink href={routes.project(id)} passHref legacyBehavior>
                <TableRow as="a" focused={focused} onClick={onClick} className={className}>
                    <ContentItem>
                        <ProjectIcon size="s" />
                    </ContentItem>

                    <TitleItem>
                        <TitleContainer>
                            <Title size="s" weight="bold">
                                {title}
                            </Title>
                        </TitleContainer>
                    </TitleItem>

                    <ContentItem />
                    <ContentItem />

                    <ContentItem>
                        <TextItem>{id}</TextItem>
                    </ContentItem>

                    <ContentItem align="center">
                        <UserGroup users={[owner] as NonNullable<ActivityByIdReturnType>[]} />
                    </ContentItem>

                    <ContentItem />
                </TableRow>
            </NextLink>
        );
    },
);
