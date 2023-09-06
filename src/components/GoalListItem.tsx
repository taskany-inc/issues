import React, { MouseEventHandler, useMemo } from 'react';
import styled from 'styled-components';
import { gapXs, gray9 } from '@taskany/colors';
import { Text, Tag as TagItem, nullable, CircleProgressBar } from '@taskany/bricks';
import { IconEyeOutline, IconStarSolid, IconMessageOutline, IconTargetOutline } from '@taskany/icons';
import type { Estimate, State as StateType, Tag } from '@prisma/client';
import { Row, Col } from 'react-awesome-styled-grid';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { estimateToString } from '../utils/estimateToString';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { State } from './State';
import { RelativeTime } from './RelativeTime/RelativeTime';
import { ListItem, ListItemIcons, ListItemProps } from './ListItem';

interface GoalListItemProps extends ListItemProps {
    title: string;
    projectId?: string | null;
    owner?: ActivityByIdReturnType | null;
    issuer?: ActivityByIdReturnType | null;
    participants?: ActivityByIdReturnType[];
    tags?: Array<Tag | undefined>;
    state?: StateType | null;
    updatedAt?: Date;
    estimate?: Estimate | null;
    comments?: number;
    priority?: string | null;
    starred?: boolean;
    watching?: boolean;
    achivedCriteriaWeight?: number | null;
    icon?: boolean;
    size?: React.ComponentProps<typeof Text>['size'];

    onTagClick?: (tag: Tag) => MouseEventHandler<HTMLDivElement>;
}

const StyledGoalTag = styled(TagItem)`
    margin: calc(${gapXs} / 2) 0;
    margin-right: ${gapXs};

    & + & {
        margin-left: 0;
    }

    &:last-child {
        margin-right: 0;
    }
`;

export const GoalListItem: React.FC<GoalListItemProps> = React.memo(
    ({
        owner,
        issuer,
        participants,
        updatedAt,
        projectId,
        tags,
        title,
        comments,
        state,
        estimate,
        priority,
        starred,
        watching,
        achivedCriteriaWeight,
        icon,
        size = 'm',
        onTagClick,
        ...attrs
    }) => {
        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean);
        }, [issuer, owner]);

        const requiredCols = [
            state && 2,
            priority && 2,
            issuers && 1,
            estimate && 2,
            achivedCriteriaWeight && 1,
            comments && 1,
        ]
            .filter(Boolean)
            .reduce((acc, curr) => acc + curr);

        const optionalCols = [
            icon && 1,
            projectId && 4,
            (starred || watching) && 2,
            participants?.length && 2,
            tags?.length && 2,
            updatedAt && 3,
        ]
            .filter(Boolean)
            .reduce((acc, curr) => acc + curr);

        const titleCols = 24 - (requiredCols + optionalCols) - 1; // FIXME: this is hack

        return (
            <ListItem {...attrs}>
                <Row align="center">
                    {nullable(icon, () => (
                        <Col md={1}>
                            <IconTargetOutline size="s" />
                        </Col>
                    ))}

                    <Col md={titleCols}>
                        <Text size={size} ellipsis lines={2}>
                            {title}
                        </Text>
                    </Col>

                    <Col md={2}>
                        {nullable(state, (s) => (
                            <div>
                                <State size="s" title={s?.title} hue={s?.hue} />
                            </div>
                        ))}
                    </Col>

                    <Col md={2}>
                        {nullable(priority, (p) => (
                            <Text size="s" color={gray9}>
                                {getPriorityText(p)}
                            </Text>
                        ))}
                    </Col>

                    {nullable(projectId, (pId) => (
                        <Col md={4} justify="center" align="center">
                            <Text size="s" color={gray9}>
                                {pId}
                            </Text>
                        </Col>
                    ))}

                    <Col md={1}>
                        <UserGroup users={issuers} />
                    </Col>

                    {nullable(participants, (p) => (
                        <Col md={2}>
                            <UserGroup users={p} />
                        </Col>
                    ))}

                    <Col md={2} justify="center" align="center">
                        {nullable(estimate, (e) => (
                            <Text size="s" color={gray9}>
                                {estimateToString(e)}
                            </Text>
                        ))}
                    </Col>

                    <Col md={1}>
                        {achivedCriteriaWeight != null && <CircleProgressBar value={achivedCriteriaWeight} />}
                    </Col>

                    {nullable(tags, (t) => (
                        <Col md={2}>
                            <div>
                                {t?.filter(Boolean).map((tag) => (
                                    <StyledGoalTag
                                        key={tag.id}
                                        description={tag.description ?? undefined}
                                        onClick={onTagClick?.(tag)}
                                    >
                                        {tag.title}
                                    </StyledGoalTag>
                                ))}
                            </div>
                        </Col>
                    ))}

                    <Col md={1}>
                        {nullable(comments, (c) => (
                            <ListItemIcons>
                                <IconMessageOutline size="s" />
                                <Text size="xs">{c}</Text>
                            </ListItemIcons>
                        ))}
                    </Col>

                    {nullable(updatedAt, (uA) => (
                        <Col md={3}>
                            <Text size="s" color={gray9}>
                                <RelativeTime date={uA} />
                            </Text>
                        </Col>
                    ))}

                    {nullable(starred || watching, () => (
                        <Col md={2} align="end">
                            <ListItemIcons>
                                {nullable(starred, () => (
                                    <IconStarSolid size="s" color={gray9} />
                                ))}

                                {nullable(watching, () => (
                                    <IconEyeOutline size="s" color={gray9} />
                                ))}
                            </ListItemIcons>
                        </Col>
                    ))}
                </Row>
            </ListItem>
        );
    },
);
