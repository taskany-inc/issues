import { FC, MouseEvent } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconAddOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { useProjectResource } from '../../hooks/useProjectResource';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { StarButton } from '../StarButton/StarButton';
import { WatchButton } from '../WatchButton/WatchButton';

import { tr } from './ProjectSubscriptionButtons.i18n';

interface ProjectSubscriptionButtonsProps {
    project: {
        flowId: string;
        title: string;
        id: string;
    };
    starred?: boolean;
    watching?: boolean;
    stargizersCounter: number;
    view?: 'default' | 'icons';
}

export const ProjectSubscriptionButtons: FC<ProjectSubscriptionButtonsProps> = ({
    project,
    starred,
    watching,
    stargizersCounter,
    view = 'default',
}) => {
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(project.id);
    const onAddClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatchModalEvent(ModalEvent.GoalCreateModal, { project })();
    };

    return (
        <>
            <WatchButton watcher={watching} view={view} onToggle={toggleProjectWatching} />
            <StarButton stargizer={starred} view={view} count={stargizersCounter} onToggle={toggleProjectStar} />
            {nullable(
                view === 'icons',
                () => (
                    <Button view="clear" iconLeft={<IconAddOutline size="s" />} onClick={onAddClick} />
                ),
                <Button text={tr('Create goal')} iconLeft={<IconAddOutline size="s" />} onClick={onAddClick} />,
            )}
        </>
    );
};
