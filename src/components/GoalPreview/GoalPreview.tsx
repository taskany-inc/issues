import React, { FC, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { danger0 } from '@taskany/colors';
import { Button, Dot, Dropdown, MenuItem, ModalContent, ModalHeader, ModalPreview, nullable } from '@taskany/bricks';
import { IconMoreVerticalOutline, IconBinOutline, IconEditOutline } from '@taskany/icons';

import { routes } from '../../hooks/router';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { GoalHeader } from '../GoalHeader';
import { GoalContentHeader } from '../GoalContentHeader/GoalContentHeader';
import { GoalActivityFeed } from '../GoalActivityFeed';
import { IssueParent } from '../IssueParent';

import { useGoalPreview } from './GoalPreviewProvider';
import { tr } from './GoalPreview.i18n';

interface GoalPreviewProps {
    shortId: string;
    goal: GoalByIdReturnType;
    defaults: Partial<GoalByIdReturnType>;
    onClose?: () => void;
    onDelete?: () => void;
}

const StyledModalHeader = styled(ModalHeader)`
    top: 0;
    position: sticky;

    box-shadow: 0 2px 5px 2px rgb(0 0 0 / 10%);
`;

const StyledModalContent = styled(ModalContent)`
    overflow: auto;
`;

const StyledModalPreview = styled(ModalPreview)`
    display: flex;
    flex-direction: column;
`;

const GoalPreviewModal: React.FC<GoalPreviewProps> = ({ shortId, goal, defaults, onClose, onDelete }) => {
    const onPreviewClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const onEditMenuChange = useCallback((item: { onClick: () => void }) => {
        item.onClick?.();
    }, []);

    const { onGoalStateChange } = useGoalResource({ id: goal?.id }, { invalidate: { getById: shortId } });

    const goalEditMenuItems = useMemo(
        () => [
            {
                label: tr('Edit'),
                icon: <IconEditOutline size="xxs" />,
                onClick: dispatchModalEvent(ModalEvent.GoalEditModal),
            },
            {
                label: tr('Delete'),
                color: danger0,
                icon: <IconBinOutline size="xxs" />,
                onClick: dispatchModalEvent(ModalEvent.GoalDeleteModal),
            },
        ],
        [],
    );

    const commentsRef = useRef<HTMLDivElement>(null);

    const onCommentsClick = useCallback(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <StyledModalPreview visible onClose={onPreviewClose}>
            <StyledModalHeader>
                <GoalHeader
                    goal={goal || defaults}
                    size="xl"
                    href={routes.goal(shortId)}
                    onCommentsClick={onCommentsClick}
                    onGoalStateChange={onGoalStateChange}
                    actions={nullable(goal?._isEditable, () => (
                        <>
                            <div />
                            <Dropdown
                                onChange={onEditMenuChange}
                                items={goalEditMenuItems}
                                renderTrigger={({ ref, onClick }) => (
                                    <Button
                                        ref={ref}
                                        ghost
                                        iconLeft={<IconMoreVerticalOutline size="xs" />}
                                        onClick={onClick}
                                    />
                                )}
                                renderItem={({ item, cursor, index, onClick }) => (
                                    <MenuItem
                                        key={item.label}
                                        ghost
                                        color={item.color}
                                        focused={cursor === index}
                                        icon={item.icon}
                                        onClick={onClick}
                                    >
                                        {item.label}
                                    </MenuItem>
                                )}
                            />
                        </>
                    ))}
                >
                    {Boolean(goal?.project?.parent?.length) &&
                        nullable(goal?.project?.parent, (parent) => (
                            <>
                                <IssueParent as="span" mode="compact" parent={parent} size="m" />
                                <Dot />
                            </>
                        ))}

                    {nullable(goal?.project, (project) => (
                        <IssueParent as="span" mode="compact" parent={project} size="m" />
                    ))}
                </GoalHeader>
            </StyledModalHeader>
            <StyledModalContent>
                {nullable(goal, (g) => (
                    <GoalContentHeader date={g.createdAt} description={g.description} />
                ))}

                {nullable(goal, (g) => (
                    <GoalActivityFeed ref={commentsRef} goal={g} shortId={shortId} onGoalDeleteConfirm={onDelete} />
                ))}
            </StyledModalContent>
        </StyledModalPreview>
    );
};

export const GoalPreview: FC = () => {
    const { setPreview, shortId, preview, defaults } = useGoalPreview();

    const onPreviewDestroy = useCallback(() => {
        setPreview(null);
    }, [setPreview]);

    return nullable(shortId, (id) => (
        <GoalPreviewModal
            shortId={id}
            goal={preview}
            defaults={defaults || {}}
            onClose={onPreviewDestroy}
            onDelete={onPreviewDestroy}
        />
    ));
};

export default GoalPreview;
