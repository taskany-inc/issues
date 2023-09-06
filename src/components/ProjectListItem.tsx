import { useMemo } from 'react';
import { CircleProgressBar, Text, nullable } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { IconStarSolid, IconEyeOutline, IconUsersOutline, IconServersOutline } from '@taskany/icons';
import { Row, Col } from 'react-awesome-styled-grid';

import { UserGroup } from './UserGroup';
import { ListItem, ListItemProps, ListItemIcons } from './ListItem';

export interface ProjectListItemProps extends ListItemProps {
    title: string;
    owner?: React.ComponentProps<typeof UserGroup>['users'][number];
    participants?: React.ComponentProps<typeof UserGroup>['users'];
    starred?: boolean;
    watching?: boolean;
    averageScore?: number | null;
    childrenCount?: number;
    icon?: boolean;
    size?: React.ComponentProps<typeof Text>['size'];
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    title,
    owner,
    participants,
    starred,
    watching,
    averageScore,
    childrenCount,
    icon,
    size = 'l',
    ...attrs
}) => {
    const titleColWidth = useMemo(() => 8 - [icon].filter(Boolean).length, [icon]);

    return (
        <ListItem {...attrs}>
            <Row align="center">
                {nullable(icon, () => (
                    <Col md={1}>
                        <IconUsersOutline size="s" />
                    </Col>
                ))}

                <Col md={titleColWidth}>
                    <Text size={size} weight="bold" ellipsis lines={2}>
                        {title}
                    </Text>
                </Col>

                <Col md={1}>
                    {nullable(childrenCount, (c) => (
                        <ListItemIcons>
                            <IconServersOutline size="xs" />
                            <Text size="xs">{c}</Text>
                        </ListItemIcons>
                    ))}
                </Col>

                <Col md={1}>
                    {nullable(owner, (o) => (
                        <UserGroup users={[o]} />
                    ))}
                </Col>

                <Col md={2}>
                    {nullable(participants, (p) => (
                        <UserGroup users={p} />
                    ))}
                </Col>

                <Col md={1}>{averageScore != null ? <CircleProgressBar value={averageScore} size="m" /> : null}</Col>

                {nullable(starred || watching, () => (
                    <Col md={11} align="end">
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
};
