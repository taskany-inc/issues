import React, { MouseEventHandler, useMemo } from 'react';
import NextLink from 'next/link';
import { nullable, GoalIcon } from '@taskany/bricks';
import type { Estimate, State as StateType } from '@prisma/client';

import { routes } from '../hooks/router';
import { Priority } from '../types/priority';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { estimateToString } from '../utils/estimateToString';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { TableRow, ContentItem, TitleItem, TitleContainer, Title, TextItem } from './Table';
import { StateDot } from './StateDot';

interface GoalListItemCompactProps {
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: StateType;
    estimate?: Estimate;
    focused?: boolean;
    priority?: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export const GoalListItemCompact: React.FC<GoalListItemCompactProps> = React.memo(
    ({ shortId, projectId, owner, issuer, title, state, focused, estimate, priority, className, onClick }) => {
        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }, [issuer, owner]);

        return (
            <NextLink href={routes.goal(shortId)} passHref>
                <TableRow as="a" focused={focused} onClick={onClick} className={className}>
                    <ContentItem>
                        <GoalIcon size="s" />
                    </ContentItem>
                    <TitleItem>
                        <TitleContainer>
                            <Title size="s" weight="bold">
                                {title}
                            </Title>
                        </TitleContainer>
                    </TitleItem>
                    <ContentItem>
                        {nullable(state, (s) => (
                            <StateDot size="m" title={s?.title} hue={s?.hue} />
                        ))}
                    </ContentItem>
                    <ContentItem>
                        <TextItem weight="regular">{getPriorityText(priority as Priority)}</TextItem>
                    </ContentItem>

                    <ContentItem>
                        <TextItem>{projectId}</TextItem>
                    </ContentItem>

                    <ContentItem align="center">
                        <UserGroup users={issuers} />
                    </ContentItem>

                    <ContentItem>
                        <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
                    </ContentItem>
                </TableRow>
            </NextLink>
        );
    },
);
