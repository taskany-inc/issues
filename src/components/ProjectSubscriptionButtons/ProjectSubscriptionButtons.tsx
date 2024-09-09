import { FC, MouseEvent } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconAddOutline, IconTopRightOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { useProjectResource } from '../../hooks/useProjectResource';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { StarButton } from '../StarButton/StarButton';
import { WatchButton } from '../WatchButton/WatchButton';
import { createGoalInlineControl } from '../../utils/domObjects';
import { NextLink } from '../NextLink';

import { tr } from './ProjectSubscriptionButtons.i18n';
import s from './ProjectSubscriptionButtons.module.css';

interface ProjectSubscriptionButtonsProps {
    project: {
        flowId: string;
        title: string;
        id: string;
    };
    starred?: boolean;
    watching?: boolean;
    stargizersCounter: number;
    href?: string;
    view?: 'default' | 'icons';
}

export const ProjectSubscriptionButtons: FC<ProjectSubscriptionButtonsProps> = ({
    project,
    starred,
    watching,
    stargizersCounter,
    href,
    view = 'default',
}) => {
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(project.id);
    const onAddClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatchModalEvent(ModalEvent.GoalCreateModal, { project })();
    };

    const onNewTabClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
    };

    return (
        <>
            <WatchButton watcher={watching} view={view} onToggle={toggleProjectWatching} />
            <StarButton stargizer={starred} view={view} count={stargizersCounter} onToggle={toggleProjectStar} />
            {nullable(
                view === 'icons',
                () => (
                    <Button
                        {...createGoalInlineControl.attr}
                        view="clear"
                        iconLeft={<IconAddOutline size="s" />}
                        onClick={onAddClick}
                    />
                ),
                <Button
                    {...createGoalInlineControl.attr}
                    text={tr('Create goal')}
                    iconLeft={<IconAddOutline size="s" />}
                    onClick={onAddClick}
                />,
            )}
            {nullable(view === 'icons' && href, (h) => (
                <NextLink href={h} target="_blank" onClick={onNewTabClick}>
                    <Button className={s.NewTabButton} view="clear" iconLeft={<IconTopRightOutline size="s" />} />
                </NextLink>
            ))}
        </>
    );
};
