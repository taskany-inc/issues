import React, {
    Children,
    FC,
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { Badge, Button, EyeIcon, StarFilledIcon, Text, nullable } from '@taskany/bricks';
import { gapS } from '@taskany/colors';

import { ActivityByIdReturnType, GoalByIdReturnType, ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { Table, TableCell, TableRow } from '../Table';
import { UserGroup } from '../UserGroup';
import { GoalListItem, GoalsListContainer } from '../GoalListItem';
import { Collapsable, collapseOffset } from '../CollapsableItem';

import { tr } from './ProjectListItem.i18n';

const StyledGoalsButton = styled(Button)`
    margin-left: ${gapS};
    cursor: pointer;
`;

export const ProjectListContainer: FC<{ children: ReactNode; offset?: number }> = ({ children, offset = 0 }) => (
    <Table columns={5} offset={offset}>
        {children}
    </Table>
);

interface ProjectListItemProps {
    href?: string;
    children?: ReactNode;
    title: string;
    owner?: ActivityByIdReturnType;
    participants?: ActivityByIdReturnType[];
    starred?: boolean;
    watching?: boolean;
}

interface ProjectListItemCollapsableProps {
    href: string;
    project: NonNullable<ProjectByIdReturnType>;
    goals?: NonNullable<GoalByIdReturnType>[];
    children?: (id: string[], deep?: number) => ReactNode;
    onCollapsedChange?: (value: boolean) => void;
    onGoalsCollapsedChange?: (value: boolean) => void;
    loading?: boolean;
    onTagClick?: React.ComponentProps<typeof GoalListItem>['onTagClick'];
    onClickProvider?: (g: NonNullable<GoalByIdReturnType>) => MouseEventHandler<HTMLAnchorElement>;
    selectedResolver?: (id: string) => boolean;
    deep?: number;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
    href,
    children,
    title,
    owner,
    participants,
    starred,
    watching,
}) => {
    const row = (
        <TableRow>
            <TableCell>
                <Text size="l" weight="bold">
                    {title}
                </Text>
                {children}
            </TableCell>

            <TableCell>
                {nullable(owner, (o) => (
                    <UserGroup users={[o]} />
                ))}
            </TableCell>

            <TableCell>{nullable(participants, (p) => (p.length ? <UserGroup users={p} /> : null))}</TableCell>

            <TableCell>
                {nullable(starred, () => (
                    <StarFilledIcon size="s" />
                ))}
            </TableCell>

            <TableCell>
                {nullable(watching, () => (
                    <EyeIcon size="s" />
                ))}
            </TableCell>
        </TableRow>
    );

    return href ? (
        <Link href={href} passHref>
            {row}
        </Link>
    ) : (
        row
    );
};

export const ProjectListItemCollapsable: React.FC<ProjectListItemCollapsableProps> = ({
    project,
    onTagClick,
    onClickProvider,
    selectedResolver,
    onCollapsedChange,
    onGoalsCollapsedChange,
    children,
    loading = false,
    goals,
    deep = 0,
}) => {
    const [collapsed, setIsCollapsed] = useState(true);
    const [collapsedGoals, setIsCollapsedGoals] = useState(true);

    const offset = collapseOffset * (collapsed ? deep - 1 : deep);

    const childs = useMemo(() => project.children.map(({ id }) => id), [project]);
    const content = collapsed ? null : children?.(childs, deep + 1);

    const onClickEnabled = children && childs.length;

    const onClick = useCallback(() => {
        if (onClickEnabled) {
            setIsCollapsed((value) => !value);
        }
    }, [onClickEnabled]);

    useEffect(() => {
        onCollapsedChange?.(collapsed);
    }, [collapsed, onCollapsedChange]);

    useEffect(() => {
        onGoalsCollapsedChange?.(collapsedGoals);
    }, [collapsedGoals, onGoalsCollapsedChange]);

    const onHeaderButtonClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();

        setIsCollapsedGoals((value) => !value);
    }, []);

    return (
        <Collapsable
            collapsed={collapsed || loading}
            onClick={onClick}
            header={
                <ProjectListContainer offset={offset}>
                    <ProjectListItem
                        title={project.title}
                        owner={project.activity}
                        participants={project.participants}
                        starred={project._isStarred}
                        watching={project._isWatching}
                    >
                        <StyledGoalsButton onClick={onHeaderButtonClick} text={tr('Goals')} />
                    </ProjectListItem>
                </ProjectListContainer>
            }
            content={content}
            deep={deep}
        >
            {!collapsedGoals && (
                <GoalsListContainer offset={offset}>
                    {nullable(goals, (goals) =>
                        goals.map((g) => (
                            <GoalListItem
                                createdAt={g.createdAt}
                                updatedAt={g.updatedAt}
                                id={g.id}
                                shortId={g._shortId}
                                projectId={g.projectId}
                                state={g.state!}
                                title={g.title}
                                issuer={g.activity!}
                                owner={g.owner!}
                                tags={g.tags}
                                priority={g.priority!}
                                comments={g._count?.comments}
                                estimate={g.estimate?.length ? g.estimate[g.estimate.length - 1] : undefined}
                                participants={g.participants}
                                starred={g._isStarred}
                                watching={g._isWatching}
                                key={g.id}
                                focused={selectedResolver?.(g.id)}
                                onClick={onClickProvider?.(g)}
                                onTagClick={onTagClick}
                            />
                        )),
                    )}
                </GoalsListContainer>
            )}
        </Collapsable>
    );
};

export const ProjectItemStandalone: React.FC<ProjectListItemProps> = (props) => (
    <ProjectListContainer>
        <ProjectListItem {...props} />
    </ProjectListContainer>
);
