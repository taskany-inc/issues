import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { gapM, gapS, gray6, gray9 } from '@taskany/colors';
import { TabsMenu, TabsMenuItem, Text, nullable } from '@taskany/bricks';

import { routes } from '../../hooks/router';
import { useProjectResource } from '../../hooks/useProjectResource';
import { PageContent, PageActions } from '../Page';
import { WatchButton } from '../WatchButton/WatchButton';
import { StarButton } from '../StarButton/StarButton';
import { ProjectTitleList } from '../ProjectTitleList';

import { tr } from './ProjectPageLayout.i18n';

interface ProjectPageLayoutProps {
    id: string;
    title: React.ReactNode;
    children: React.ReactNode;
    parent?: React.ComponentProps<typeof ProjectTitleList>['projects'];
    owned?: boolean;
    starred?: boolean;
    stargizers?: number;
    watching?: boolean;
    description?: React.ReactNode;
    actions?: boolean;
}

const ProjectHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const StyledProjectHeaderTitle = styled(Text)`
    width: 850px;
    padding-top: ${gapM};
`;

const StyledProjectParentTitle = styled(Text)`
    display: inline-block;
    padding-top: ${gapM};
`;

export const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({
    id,
    title,
    parent,
    description,
    owned,
    starred,
    stargizers,
    watching,
    children,
    actions,
}) => {
    const router = useRouter();
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(id);

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [tr('Goals'), routes.project(id), true],
        [tr('Settings'), routes.projectSettings(id), true],
    ];

    return (
        <>
            <ProjectHeader>
                <div>
                    {Boolean(parent?.length) &&
                        nullable(parent, (parent) => (
                            <StyledProjectParentTitle weight="bold" color={gray9}>
                                <ProjectTitleList projects={parent} />
                            </StyledProjectParentTitle>
                        ))}

                    <StyledProjectHeaderTitle size="xxl" weight="bolder">
                        {title}
                    </StyledProjectHeaderTitle>

                    {nullable(description, (d) => (
                        <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                            {d}
                        </Text>
                    ))}
                </div>

                <PageActions>
                    {nullable(actions, () => (
                        <>
                            <WatchButton watcher={watching} onToggle={toggleProjectWatching} />
                            <StarButton stargizer={starred} count={stargizers} onToggle={toggleProjectStar} />
                        </>
                    ))}
                </PageActions>

                {owned && (
                    <TabsMenu>
                        {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                            nullable(ownerOnly ? owned : true, () => (
                                <NextLink key={title} href={href} passHref>
                                    <TabsMenuItem active={router.asPath.split('?')[0] === href}>{title}</TabsMenuItem>
                                </NextLink>
                            )),
                        )}
                    </TabsMenu>
                )}
            </ProjectHeader>

            {children}
        </>
    );
};
