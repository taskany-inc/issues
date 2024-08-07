import { IconAddOutline } from '@taskany/icons';
import { FC, MouseEvent, useState } from 'react';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { useProjectResource } from '../../hooks/useProjectResource';
import { Icon as WatchIcon } from '../WatchButton/WatchButton';
import { Icon as StarIcon } from '../StarButton/StarButton';
import { watch } from '../../utils/domObjects';

import s from './ProjectSubscriptionIconButtons.module.css';

interface ProjectSubscriptionIconButtons {
    project: {
        flowId: string;
        title: string;
        id: string;
    };
    starred?: boolean;
    watching?: boolean;
}

export const ProjectSubscriptionIconButtons: FC<ProjectSubscriptionIconButtons> = ({ project, starred, watching }) => {
    const [isStarred, setIsStarred] = useState(!!starred);
    const [isWatching, setIsWatching] = useState(!!watching);
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(project.id);
    const onStarClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        toggleProjectStar(isStarred);
        setIsStarred((p) => !p);
    };

    const onWatchClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        toggleProjectWatching(isWatching);
        setIsWatching((p) => !p);
    };

    const onAddClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatchModalEvent(ModalEvent.GoalCreateModal, { project })();
    };
    return (
        <>
            <button className={s.ProjectSubscriptionIconButtons} onClick={onWatchClick} {...watch.attr}>
                <WatchIcon watching={isWatching} className={s.ProjectSubscriptionIconButtonsWatchIcon} />
            </button>
            <button className={s.ProjectSubscriptionIconButtons} onClick={onStarClick}>
                <StarIcon filled={isStarred} />
            </button>
            <button className={s.ProjectSubscriptionIconButtons} onClick={onAddClick}>
                <IconAddOutline size="s" />
            </button>
        </>
    );
};
